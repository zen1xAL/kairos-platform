<?php

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'Backend\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = __DIR__ . '/../src/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

use Backend\Config;
use Backend\GoogleOAuthService;
use Backend\InvalidConfigurationException;
use Backend\OAuthException;
use Backend\Response;
use Backend\StateSigner;

$config = Config::load();
$service = new GoogleOAuthService($config);
$stateSigner = new StateSigner($config->appSecret());

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config->frontendOrigins();
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    Response::noContent();
    return;
}

$path = rtrim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/');

try {
    match (true) {
        $path === '/api/health' && $method === 'GET' => Response::json(['status' => 'ok']),
        $path === '/api/auth/google/url' && $method === 'GET' => Response::json([
            'url' => $service->buildAuthorizationUrl($stateSigner->create($origin !== '' ? $origin : $allowedOrigins[0])),
        ]),
        $path === '/api/auth/google/callback' && $method === 'GET' => handleCallback($service, $stateSigner, $allowedOrigins),
        default => Response::json(['error' => 'Not found'], 404),
    };
} catch (OAuthException $exception) {
    Response::json(['error' => $exception->getMessage()], 502);
} catch (InvalidConfigurationException $exception) {
    Response::json(['error' => $exception->getMessage()], 500);
}

function handleCallback(GoogleOAuthService $service, StateSigner $stateSigner, array $allowedOrigins): void
{
    $state = $_GET['state'] ?? '';
    $error = $_GET['error'] ?? '';
    $code = $_GET['code'] ?? '';

    if ($error !== '') {
        Response::json(['error' => 'Google returned an authorization error: ' . $error], 502);
        return;
    }

    if (!is_string($state) || !is_string($code) || !$stateSigner->verify($state)) {
        Response::json(['error' => 'Invalid or expired state parameter'], 400);
        return;
    }

    $origin = $stateSigner->extractOrigin($state);
    if (!in_array($origin, $allowedOrigins, true)) {
        Response::json(['error' => 'Unknown frontend origin in state'], 400);
        return;
    }

    $tokens = $service->exchangeAuthorizationCode($code);
    $profile = $service->fetchProfile($tokens->accessToken);

    $session = [
        'name' => $profile->name,
        'email' => $profile->email,
        'picture' => $profile->pictureUrl,
        'token' => $tokens->idToken,
    ];
    $encoded = rtrim(strtr(base64_encode((string) json_encode($session, JSON_UNESCAPED_SLASHES)), '+/', '-_'), '=');

    Response::redirect($origin . '/#auth=' . $encoded);
}
