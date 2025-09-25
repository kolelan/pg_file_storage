<?php
class FileManager {
    private $conn;
    private $table_name = "files";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function uploadFile($userId, $filename, $originalName, $fileSize, $mimeType) {
        // Начало транзакции
        $this->conn->beginTransaction();

        try {
            // Создание large object
            $oid = $this->conn->pgsqlLOBCreate();
            $stream = $this->conn->pgsqlLOBOpen($oid, 'w');

            // Чтение и запись файла по частям
            $fileHandle = fopen($filename, 'rb');
            while ($data = fread($fileHandle, 8192)) {
                fwrite($stream, $data);
            }
            fclose($fileHandle);
            fclose($stream);

            // Сохранение метаданных
            $query = "INSERT INTO " . $this->table_name .
                " (user_id, filename, original_name, file_size, mime_type, lo_oid) 
                     VALUES (:user_id, :filename, :original_name, :file_size, :mime_type, :lo_oid)";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $userId);
            $stmt->bindParam(":filename", $originalName); // Используем original_name как filename
            $stmt->bindParam(":original_name", $originalName);
            $stmt->bindParam(":file_size", $fileSize);
            $stmt->bindParam(":mime_type", $mimeType);
            $stmt->bindParam(":lo_oid", $oid);

            if($stmt->execute()) {
                $this->conn->commit();
                return $this->conn->lastInsertId();
            }

            $this->conn->rollBack();
            return false;

        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function downloadFile($fileId, $userId) {
        $query = "SELECT * FROM " . $this->table_name .
            " WHERE id = :id AND (user_id = :user_id OR is_public = true)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $fileId);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();

        $file = $stmt->fetch(PDO::FETCH_ASSOC);

        if($file) {
            // Увеличение счетчика скачиваний
            $this->incrementDownloadCount($fileId);

            // Чтение large object
            $content = '';
            
            // Начинаем транзакцию для работы с Large Object
            $this->conn->beginTransaction();
            
            try {
                // Открываем Large Object
                $result = $this->conn->query("SELECT lo_open({$file['lo_oid']}, 262144) as fd");
                $fd = $result->fetch(PDO::FETCH_ASSOC)['fd'];
                
                if ($fd === false) {
                    throw new Exception('Cannot open large object');
                }
                
                // Читаем содержимое по частям
                $chunkSize = 8192;
                $totalSize = $file['file_size'];
                $readBytes = 0;
                
                while ($readBytes < $totalSize) {
                    $bytesToRead = min($chunkSize, $totalSize - $readBytes);
                    $result = $this->conn->query("SELECT loread($fd, $bytesToRead) as data");
                    $row = $result->fetch(PDO::FETCH_ASSOC);
                    $data = $row['data'];
                    
                    if ($data === false || $data === null || $data === '') {
                        break;
                    }
                    
                    // Преобразуем resource в строку, если необходимо
                    if (is_resource($data)) {
                        $data = stream_get_contents($data);
                    }
                    
                    $content .= $data;
                    $readBytes += strlen($data);
                }
                
                // Закрываем Large Object
                $this->conn->query("SELECT lo_close($fd)");
                
                // Подтверждаем транзакцию
                $this->conn->commit();
                
            } catch (Exception $e) {
                // Откатываем транзакцию в случае ошибки
                $this->conn->rollback();
                throw $e;
            }

            return [
                'content' => $content,
                'filename' => $file['original_name'],
                'mime_type' => $file['mime_type']
            ];
        }

        return false;
    }

    private function incrementDownloadCount($fileId) {
        $query = "UPDATE " . $this->table_name .
            " SET download_count = download_count + 1 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $fileId);
        $stmt->execute();
    }

    public function getUserFiles($userId, $isAdmin = false, $options = []) {
        $page = isset($options['page']) ? (int)$options['page'] : 1;
        $limit = isset($options['limit']) ? (int)$options['limit'] : 10;
        $sortBy = isset($options['sort_by']) ? $options['sort_by'] : 'created_at';
        $sortOrder = isset($options['sort_order']) ? $options['sort_order'] : 'DESC';
        $search = isset($options['search']) ? $options['search'] : '';
        $userFilter = isset($options['user_filter']) ? $options['user_filter'] : '';
        $sizeFrom = isset($options['size_from']) ? (int)$options['size_from'] : null;
        $sizeTo = isset($options['size_to']) ? (int)$options['size_to'] : null;
        $dateFrom = isset($options['date_from']) ? $options['date_from'] : '';
        $dateTo = isset($options['date_to']) ? $options['date_to'] : '';

        // Валидация параметров сортировки
        $allowedSortFields = ['id', 'original_name', 'file_size', 'created_at', 'username'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }
        if (!in_array(strtoupper($sortOrder), ['ASC', 'DESC'])) {
            $sortOrder = 'DESC';
        }

        $offset = ($page - 1) * $limit;

        if($isAdmin) {
            // Базовый запрос для админа
            $query = "SELECT f.*, u.username FROM " . $this->table_name . " f 
                     LEFT JOIN users u ON f.user_id = u.id";
            $countQuery = "SELECT COUNT(*) FROM " . $this->table_name . " f 
                          LEFT JOIN users u ON f.user_id = u.id";
            
            $conditions = [];
            $params = [];

            // Добавляем условия фильтрации
            if (!empty($search)) {
                $conditions[] = "(f.original_name ILIKE :search OR u.username ILIKE :search)";
                $params[':search'] = '%' . $search . '%';
            }

            if (!empty($userFilter)) {
                $conditions[] = "u.username ILIKE :user_filter";
                $params[':user_filter'] = '%' . $userFilter . '%';
            }

            if ($sizeFrom !== null) {
                $conditions[] = "f.file_size >= :size_from";
                $params[':size_from'] = $sizeFrom;
            }

            if ($sizeTo !== null) {
                $conditions[] = "f.file_size <= :size_to";
                $params[':size_to'] = $sizeTo;
            }

            if (!empty($dateFrom)) {
                $conditions[] = "f.created_at >= :date_from";
                $params[':date_from'] = $dateFrom;
            }

            if (!empty($dateTo)) {
                $conditions[] = "f.created_at <= :date_to";
                $params[':date_to'] = $dateTo;
            }

            if (!empty($conditions)) {
                $whereClause = " WHERE " . implode(" AND ", $conditions);
                $query .= $whereClause;
                $countQuery .= $whereClause;
            }

            // Добавляем сортировку
            $sortField = $sortBy === 'username' ? 'u.username' : 'f.' . $sortBy;
            $query .= " ORDER BY " . $sortField . " " . $sortOrder;
            
            // Добавляем лимит и оффсет
            $query .= " LIMIT :limit OFFSET :offset";
            $params[':limit'] = $limit;
            $params[':offset'] = $offset;

        } else {
            // Запрос для обычного пользователя
            $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id";
            $countQuery = "SELECT COUNT(*) FROM " . $this->table_name . " WHERE user_id = :user_id";
            $params = [':user_id' => $userId];

            // Добавляем поиск по имени файла для пользователя
            if (!empty($search)) {
                $query .= " AND original_name ILIKE :search";
                $countQuery .= " AND original_name ILIKE :search";
                $params[':search'] = '%' . $search . '%';
            }

            // Фильтрация по размеру для пользователя
            if ($sizeFrom !== null) {
                $query .= " AND file_size >= :size_from";
                $countQuery .= " AND file_size >= :size_from";
                $params[':size_from'] = $sizeFrom;
            }

            if ($sizeTo !== null) {
                $query .= " AND file_size <= :size_to";
                $countQuery .= " AND file_size <= :size_to";
                $params[':size_to'] = $sizeTo;
            }

            // Фильтрация по дате для пользователя
            if (!empty($dateFrom)) {
                $query .= " AND created_at >= :date_from";
                $countQuery .= " AND created_at >= :date_from";
                $params[':date_from'] = $dateFrom;
            }

            if (!empty($dateTo)) {
                $query .= " AND created_at <= :date_to";
                $countQuery .= " AND created_at <= :date_to";
                $params[':date_to'] = $dateTo;
            }

            // Добавляем сортировку
            $query .= " ORDER BY " . $sortBy . " " . $sortOrder;
            
            // Добавляем лимит и оффсет
            $query .= " LIMIT :limit OFFSET :offset";
            $params[':limit'] = $limit;
            $params[':offset'] = $offset;
        }

        // Выполняем запрос для получения данных
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Выполняем запрос для подсчета общего количества
        $countStmt = $this->conn->prepare($countQuery);
        foreach ($params as $key => $value) {
            if ($key !== ':limit' && $key !== ':offset') {
                $countStmt->bindValue($key, $value);
            }
        }
        $countStmt->execute();
        $totalCount = $countStmt->fetchColumn();

        return [
            'files' => $files,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => (int)$totalCount,
                'total_pages' => ceil($totalCount / $limit)
            ]
        ];
    }
}
?>