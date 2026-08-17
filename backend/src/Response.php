<?php

declare(strict_types=1);

namespace Backend;

final class Response
{
    public static function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo (string) json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public static function noContent(): void
    {
        http_response_code(204);
    }

    public static function redirect(string $url): void
    {
        http_response_code(302);
        header('Location: ' . $url);
    }
}
