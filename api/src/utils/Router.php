<?php
class Router {
    private $routes = [];

    public function get($path, $handler) {
        $this->routes['GET'][$path] = $handler;
    }

    public function post($path, $handler) {
        $this->routes['POST'][$path] = $handler;
    }

    public function put($path, $handler) {
        $this->routes['PUT'][$path] = $handler;
    }

    public function delete($path, $handler) {
        $this->routes['DELETE'][$path] = $handler;
    }

    public function dispatch($method, $uri) {
        if (!isset($this->routes[$method])) {
            Response::error('Method not allowed', 405);
            return;
        }

        foreach ($this->routes[$method] as $pattern => $handler) {
            if ($this->matchRoute($pattern, $uri, $matches)) {
                // Удаляем первый элемент (полное совпадение)
                array_shift($matches);
                
                // Вызываем обработчик с параметрами
                if (is_callable($handler)) {
                    call_user_func_array($handler, $matches);
                } else {
                    Response::error('Invalid handler', 500);
                }
                return;
            }
        }

        Response::error('Route not found', 404);
    }

    private function matchRoute($pattern, $uri, &$matches) {
        // Преобразуем паттерн в регулярное выражение
        $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $pattern);
        $pattern = str_replace('/', '\/', $pattern);
        $pattern = '/^' . $pattern . '$/';

        return preg_match($pattern, $uri, $matches);
    }
}
?>
