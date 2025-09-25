<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'postgres';
        $this->db_name = getenv('DB_NAME') ?: 'file_storage';
        $this->username = getenv('DB_USER') ?: 'admin';
        $this->password = getenv('DB_PASS') ?: 'password';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "pgsql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            // PostgreSQL doesn't need "set names utf8"
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>