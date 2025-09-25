<?php
require_once 'src/utils/JWT.php';
require_once 'src/utils/Response.php';

class FileController {
    private $conn;
    private $fileManager;

    public function __construct($db) {
        $this->conn = $db;
        $this->fileManager = new FileManager($db);
    }

    public function uploadFile() {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No file uploaded or upload error', 400);
        }

        $file = $_FILES['file'];
        $userId = $payload['user_id'];

        // Проверяем размер файла (10MB лимит)
        $maxFileSize = 10 * 1024 * 1024; // 10MB
        if ($file['size'] > $maxFileSize) {
            Response::error('File too large. Maximum size is 10MB', 413);
        }

        // Проверяем количество файлов пользователя
        $userFiles = $this->fileManager->getUserFiles($userId);
        if (count($userFiles) >= 10) {
            Response::error('File limit reached. Maximum 10 files allowed', 413);
        }

        try {
            $fileId = $this->fileManager->uploadFile(
                $userId,
                $file['tmp_name'],
                $file['name'],
                $file['size'],
                $file['type']
            );

            if ($fileId) {
                Response::success([
                    'file' => [
                        'id' => $fileId,
                        'name' => $file['name'],
                        'size' => $file['size'],
                        'type' => $file['type']
                    ]
                ], 'File uploaded successfully', 201);
            } else {
                Response::error('Failed to upload file', 500);
            }
        } catch (Exception $e) {
            Response::error('Upload failed: ' . $e->getMessage(), 500);
        }
    }

    public function getUserFiles() {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        $files = $this->fileManager->getUserFiles($payload['user_id']);

        Response::success(['files' => $files], 'Files retrieved successfully');
    }

    public function getAllFiles() {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        if ($payload['role'] !== 'admin') {
            Response::forbidden('Admin access required');
        }

        $files = $this->fileManager->getUserFiles(null, true);

        Response::success(['files' => $files], 'All files retrieved successfully');
    }

    public function downloadFile($fileId) {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        $fileData = $this->fileManager->downloadFile($fileId, $payload['user_id']);

        if (!$fileData) {
            Response::notFound('File not found or access denied');
        }

        // Очищаем буфер вывода
        if (ob_get_level()) {
            ob_end_clean();
        }

        // Устанавливаем заголовки для скачивания
        header('Content-Type: ' . $fileData['mime_type']);
        header('Content-Disposition: attachment; filename="' . $fileData['filename'] . '"');
        header('Content-Length: ' . strlen($fileData['content']));
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');

        // Выводим содержимое файла
        echo $fileData['content'];
        exit();
    }

    public function deleteFile($fileId) {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        // Проверяем, существует ли файл и принадлежит ли пользователю
        $query = "SELECT * FROM files WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $fileId);
        $stmt->execute();

        $file = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$file) {
            Response::notFound('File not found');
        }

        // Проверяем права доступа
        if ($file['user_id'] != $payload['user_id'] && $payload['role'] !== 'admin') {
            Response::forbidden('Access denied');
        }

        try {
            // Удаляем large object
            $this->conn->beginTransaction();
            
            $stream = $this->conn->pgsqlLOBOpen($file['lo_oid'], 'w');
            $this->conn->pgsqlLOBUnlink($file['lo_oid']);
            
            // Удаляем запись из базы
            $deleteQuery = "DELETE FROM files WHERE id = :id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':id', $fileId);
            
            if ($deleteStmt->execute()) {
                $this->conn->commit();
                Response::success(null, 'File deleted successfully');
            } else {
                $this->conn->rollBack();
                Response::error('Failed to delete file', 500);
            }
        } catch (Exception $e) {
            $this->conn->rollBack();
            Response::error('Delete failed: ' . $e->getMessage(), 500);
        }
    }
}
?>
