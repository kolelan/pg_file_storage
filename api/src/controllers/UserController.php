<?php
require_once __DIR__ . '/../models/User.php';

class UserController {
    private $user;

    public function __construct() {
        $database = new Database();
        $db = $database->getConnection();
        $this->user = new User($db);
    }

    public function getAllUsers() {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        // Проверяем, что пользователь - администратор
        if ($payload['role'] !== 'admin') {
            Response::forbidden('Access denied. Admin role required.');
        }

        $users = $this->user->getAllUsers();
        Response::success(['users' => $users], 'Users retrieved successfully');
    }

    public function getUser($userId) {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        // Проверяем, что пользователь - администратор
        if ($payload['role'] !== 'admin') {
            Response::forbidden('Access denied. Admin role required.');
        }

        $user = $this->user->findById($userId);
        
        if (!$user) {
            Response::notFound('User not found');
        }

        Response::success(['user' => $user], 'User retrieved successfully');
    }

    public function updateUserRole($userId) {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        // Проверяем, что пользователь - администратор
        if ($payload['role'] !== 'admin') {
            Response::forbidden('Access denied. Admin role required.');
        }

        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['role'])) {
            Response::badRequest('Role is required');
        }

        $newRole = $data['role'];
        
        // Валидация роли
        if (!in_array($newRole, ['user', 'admin'])) {
            Response::badRequest('Invalid role. Allowed values: user, admin');
        }

        // Проверяем, что пользователь существует
        $user = $this->user->findById($userId);
        if (!$user) {
            Response::notFound('User not found');
        }

        // Нельзя изменить роль самому себе
        if ($payload['user_id'] == $userId) {
            Response::badRequest('Cannot change your own role');
        }

        if ($this->user->updateRole($userId, $newRole)) {
            $updatedUser = $this->user->findById($userId);
            Response::success(['user' => $updatedUser], 'User role updated successfully');
        } else {
            Response::internalServerError('Failed to update user role');
        }
    }

    public function deleteUser($userId) {
        $payload = JWT::validateToken();
        
        if (!$payload) {
            Response::unauthorized('Invalid token');
        }

        // Проверяем, что пользователь - администратор
        if ($payload['role'] !== 'admin') {
            Response::forbidden('Access denied. Admin role required.');
        }

        // Проверяем, что пользователь существует
        $user = $this->user->findById($userId);
        if (!$user) {
            Response::notFound('User not found');
        }

        // Нельзя удалить самого себя
        if ($payload['user_id'] == $userId) {
            Response::badRequest('Cannot delete your own account');
        }

        if ($this->user->deleteUser($userId)) {
            Response::success(null, 'User deleted successfully');
        } else {
            Response::internalServerError('Failed to delete user');
        }
    }
}
?>
