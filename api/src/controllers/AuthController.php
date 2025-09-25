<?php
require_once 'src/utils/JWT.php';
require_once 'src/utils/Response.php';

class AuthController {
    private $conn;
    private $user;

    public function __construct($db) {
        $this->conn = $db;
        $this->user = new User($db);
    }

    public function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['username']) || !isset($input['password'])) {
            Response::validationError(['username' => 'Required', 'password' => 'Required']);
        }

        $username = trim($input['username']);
        $password = $input['password'];

        // Находим пользователя
        $userData = $this->user->findByUsername($username);
        
        if (!$userData) {
            Response::error('Invalid credentials', 401);
        }

        // Проверяем пароль
        if (!password_verify($password, $userData['password_hash'])) {
            Response::error('Invalid credentials', 401);
        }

        // Создаем JWT токен
        $payload = [
            'user_id' => $userData['id'],
            'username' => $userData['username'],
            'role' => $userData['role'],
            'exp' => time() + (24 * 60 * 60) // 24 часа
        ];

        $token = JWT::encode($payload);

        Response::success([
            'token' => $token,
            'user' => [
                'id' => $userData['id'],
                'username' => $userData['username'],
                'email' => $userData['email'],
                'role' => $userData['role']
            ]
        ], 'Login successful');
    }

    public function register() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError(['message' => 'Invalid JSON']);
        }

        $errors = [];

        // Валидация
        if (empty($input['username'])) {
            $errors['username'] = 'Username is required';
        } elseif (strlen($input['username']) < 3) {
            $errors['username'] = 'Username must be at least 3 characters';
        }

        if (empty($input['email'])) {
            $errors['email'] = 'Email is required';
        } elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        }

        if (empty($input['password'])) {
            $errors['password'] = 'Password is required';
        } elseif (strlen($input['password']) < 6) {
            $errors['password'] = 'Password must be at least 6 characters';
        }

        if (!empty($errors)) {
            Response::validationError($errors);
        }

        // Проверяем, существует ли пользователь
        $existingUser = $this->user->findByUsername($input['username']);
        if ($existingUser) {
            Response::error('Username already exists', 409);
        }

        // Проверяем email
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $input['email']);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Response::error('Email already exists', 409);
        }

        // Создаем пользователя
        $this->user->username = $input['username'];
        $this->user->email = $input['email'];
        $this->user->password_hash = password_hash($input['password'], PASSWORD_DEFAULT);
        $this->user->role = 'user';

        if ($this->user->create()) {
            Response::success(null, 'User registered successfully', 201);
        } else {
            Response::error('Failed to create user', 500);
        }
    }

    public function refresh() {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        // Создаем новый токен
        $newPayload = [
            'user_id' => $payload['user_id'],
            'username' => $payload['username'],
            'role' => $payload['role'],
            'exp' => time() + (24 * 60 * 60)
        ];

        $token = JWT::encode($newPayload);

        Response::success(['token' => $token], 'Token refreshed');
    }

    public function getAllUsers() {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        if ($payload['role'] !== 'admin') {
            Response::forbidden('Admin access required');
        }

        $query = "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['users' => $users], 'Users retrieved successfully');
    }
}
?>
