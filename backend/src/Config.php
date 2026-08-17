<?php

declare(strict_types=1);

namespace Backend;

final class Config
{
    private readonly string $clientId;

    private readonly string $clientSecret;

    private readonly string $redirectUri;

    private readonly array $frontendOrigins;

    private readonly string $appSecret;

    public function __construct(
        string $clientId,
        string $clientSecret,
        string $redirectUri,
        array $frontendOrigins,
        string $appSecret
    ) {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->redirectUri = $redirectUri;
        $this->frontendOrigins = $frontendOrigins;
        $this->appSecret = $appSecret;
    }

    public static function fromEnvFile(string $path): self
    {
        if (!is_file($path)) {
            throw new InvalidConfigurationException("Environment file not found: {$path}");
        }

        $values = [];
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            if (str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim($value);
        }

        return new self(
            self::require($values, 'GOOGLE_CLIENT_ID'),
            self::require($values, 'GOOGLE_CLIENT_SECRET'),
            self::require($values, 'GOOGLE_REDIRECT_URI'),
            array_map(
                static fn (string $origin): string => rtrim($origin, '/'),
                explode(',', self::require($values, 'FRONTEND_ORIGINS'))
            ),
            self::require($values, 'APP_SECRET')
        );
    }

    private static function require(array $values, string $key): string
    {
        $value = $values[$key] ?? '';
        if ($value === '') {
            throw new InvalidConfigurationException("Missing required environment value: {$key}");
        }

        return $value;
    }

    public function clientId(): string
    {
        return $this->clientId;
    }

    public function clientSecret(): string
    {
        return $this->clientSecret;
    }

    public function redirectUri(): string
    {
        return $this->redirectUri;
    }

    public function frontendOrigins(): array
    {
        return $this->frontendOrigins;
    }

    public function appSecret(): string
    {
        return $this->appSecret;
    }
}
