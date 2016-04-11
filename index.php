<?php

session_start();
$pathBase = (string) (__DIR__ . '/');
include $pathBase . 'vendor/autoload.php';
$request = new \Mwyatt\Core\Request;

if ($request->getServer('HTTP_HOST') === '192.168.1.6') {
	ini_set('display_startup_errors',1);
	ini_set('display_errors',1);
	error_reporting(-1);
}

$url = new \Mwyatt\Core\Url($request->getServer('HTTP_HOST'), $request->getServer('REQUEST_URI'), 'codex/');
$view = new \Mwyatt\Core\View;
$view->prependTemplatePath($pathBase . 'template/');
$view->setPathBase($pathBase);

$view->data->offsetSet('url', $url);

$routes = array_merge(
    include $view->getPathBase('routes.php')
);

$router = new \Mwyatt\Core\Router(new \Pux\Mux);

$router->appendMuxRoutes($routes);

$url->setRoutes($router->getMux());

$route = $router->getMuxRouteCurrent($url->getPath());

if ($route) {
	$request->setMuxUrlVars($route);
	$controllerNs = $router->getMuxRouteCurrentController();
	$controllerMethod = $router->getMuxRouteCurrentControllerMethod();

	$controller = new $controllerNs(new \Pimple\Container, $view);
	$response = $controller->$controllerMethod($request);
} else {
	$response = new \Mwyatt\Core\Response('Not Found', 404);
}

$router->setHeaders($response);

file_put_contents('index.html', $response->getContent());

echo $response->getContent();
