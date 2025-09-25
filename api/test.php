<?php
// Простой тест для проверки работоспособности API

echo "<h1>API Test</h1>";

// Тест подключения к базе данных
echo "<h2>Database Connection Test</h2>";
try {
    require_once 'src/config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo "✅ Database connection successful<br>";
        
        // Тест запроса к таблице users
        $query = "SELECT COUNT(*) as count FROM users";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Users table accessible. Count: " . $result['count'] . "<br>";
        
        // Тест запроса к таблице files
        $query = "SELECT COUNT(*) as count FROM files";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Files table accessible. Count: " . $result['count'] . "<br>";
        
    } else {
        echo "❌ Database connection failed<br>";
    }
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Тест JWT
echo "<h2>JWT Test</h2>";
try {
    require_once 'src/utils/JWT.php';
    
    $payload = ['user_id' => 1, 'username' => 'test', 'exp' => time() + 3600];
    $token = JWT::encode($payload);
    echo "✅ JWT encoding successful<br>";
    
    $decoded = JWT::decode($token);
    if ($decoded && $decoded['user_id'] == 1) {
        echo "✅ JWT decoding successful<br>";
    } else {
        echo "❌ JWT decoding failed<br>";
    }
} catch (Exception $e) {
    echo "❌ JWT error: " . $e->getMessage() . "<br>";
}

// Тест моделей
echo "<h2>Models Test</h2>";
try {
    require_once 'src/models/User.php';
    require_once 'src/models/FileManager.php';
    
    $user = new User($db);
    echo "✅ User model loaded<br>";
    
    $fileManager = new FileManager($db);
    echo "✅ FileManager model loaded<br>";
    
} catch (Exception $e) {
    echo "❌ Models error: " . $e->getMessage() . "<br>";
}

echo "<h2>API Endpoints</h2>";
echo "Available endpoints:<br>";
echo "• POST /api/auth/login<br>";
echo "• POST /api/auth/register<br>";
echo "• GET /api/files<br>";
echo "• POST /api/files/upload<br>";
echo "• GET /api/files/download/{id}<br>";
echo "• DELETE /api/files/{id}<br>";
echo "• GET /api/admin/files<br>";
echo "• GET /api/admin/users<br>";

echo "<h2>Test Complete</h2>";
echo "If all tests show ✅, the API is ready to use!";
?>
