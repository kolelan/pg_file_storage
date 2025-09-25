<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Подключение необходимых файлов
require_once 'src/config/database.php';
require_once 'src/models/User.php';
require_once 'src/models/FileManager.php';
require_once 'src/controllers/AuthController.php';
require_once 'src/controllers/FileController.php';
require_once 'src/controllers/UserController.php';
require_once 'src/utils/Router.php';
require_once 'src/utils/Response.php';
require_once 'src/utils/JWT.php';

// Инициализация базы данных
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::error('Database connection failed', 500);
    exit();
}

// Инициализация роутера
$router = new Router();

// Маршруты аутентификации
$router->post('/auth/login', function() use ($db) {
    $controller = new AuthController($db);
    $controller->login();
});

$router->post('/auth/register', function() use ($db) {
    $controller = new AuthController($db);
    $controller->register();
});

$router->post('/auth/refresh', function() use ($db) {
    $controller = new AuthController($db);
    $controller->refresh();
});

// Маршруты файлов (требуют аутентификации)
$router->get('/files', function() use ($db) {
    $controller = new FileController($db);
    $controller->getUserFiles();
});

$router->post('/files/upload', function() use ($db) {
    $controller = new FileController($db);
    $controller->uploadFile();
});

$router->get('/files/download/(\d+)', function($fileId) use ($db) {
    $controller = new FileController($db);
    $controller->downloadFile($fileId);
});

$router->delete('/files/(\d+)', function($fileId) use ($db) {
    $controller = new FileController($db);
    $controller->deleteFile($fileId);
});

// Админ маршруты
$router->get('/admin/files', function() use ($db) {
    $controller = new FileController($db);
    $controller->getAllFiles();
});

// Маршруты управления пользователями (только для админов)
$router->get('/users', function() {
    $controller = new UserController();
    $controller->getAllUsers();
});

$router->get('/users/(\d+)', function($userId) {
    $controller = new UserController();
    $controller->getUser($userId);
});

$router->put('/users/(\d+)/role', function($userId) {
    $controller = new UserController();
    $controller->updateUserRole($userId);
});

$router->delete('/users/(\d+)', function($userId) {
    $controller = new UserController();
    $controller->deleteUser($userId);
});

// Обработка запроса
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Удаляем базовый путь если есть
$basePath = '/api';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Удаляем query string
$requestUri = strtok($requestUri, '?');

try {
    $router->dispatch($requestMethod, $requestUri);
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
?>
