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

    public function getUserFiles($userId, $isAdmin = false) {
        if($isAdmin) {
            $query = "SELECT f.*, u.username FROM " . $this->table_name . " f 
                     LEFT JOIN users u ON f.user_id = u.id 
                     ORDER BY f.created_at DESC";
        } else {
            $query = "SELECT * FROM " . $this->table_name .
                " WHERE user_id = :user_id ORDER BY created_at DESC";
        }

        $stmt = $this->conn->prepare($query);
        if(!$isAdmin) {
            $stmt->bindParam(":user_id", $userId);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>