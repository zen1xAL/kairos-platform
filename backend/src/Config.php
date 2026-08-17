<?php

declare(strict_types=1);

namespace Backend;

final readonly class Config
{
    public function __construct(
        public string $clientId,
        public string $clientSecret,
        public string $redirectUri,
        public array $frontendOrigins,
        public string $appSecret,
    ) {
    }

    public static function load(?string $envPath = null): self
    {
        $values = [];
        $path = $envPath ?? __DIR__ . '/../.env';

        if (is_file($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                if (str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$key, $value] = explode('=', $line, 2);
                $values[trim($key)] = trim($value);
            }
        }

        return new self(
            self::resolve($values, 'GOOGLE_CLIENT_ID'),
            self::resolve($values, 'GOOGLE_CLIENT_SECRET'),
            self::resolve($values, 'GOOGLE_REDIRECT_URI'),
            array_map(
                static fn (string $origin): string => rtrim($origin, '/'),
                explode(',', self::resolve($values, 'FRONTEND_ORIGINS'))
            ),
            self::resolve($values, 'APP_SECRET'),
        );
    }

    public static function fromEnvFile(string $path): self
    {
        return self::load($path);
    }

    private static function resolve(array $values, string $key): string
    {
        $value = $values[$key] ?? ($_ENV[$key] ?? (getenv($key) ?: ''));
        if ($value === '') {
            throw new InvalidConfigurationException("Missing required environment value: {$key}");
        }

        return (string) $value;
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
