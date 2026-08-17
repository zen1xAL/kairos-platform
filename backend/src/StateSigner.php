<?php

declare(strict_types=1);

namespace Backend;

final class StateSigner
{
    private const STATE_TTL_SECONDS = 600;

    private readonly string $secret;

    public function __construct(string $secret)
    {
        $this->secret = $secret;
    }

    public function create(string $origin): string
    {
        $payload = [
            'exp' => time() + self::STATE_TTL_SECONDS,
            'nonce' => bin2hex(random_bytes(8)),
            'origin' => rtrim($origin, '/'),
        ];
        $encoded = self::base64UrlEncode((string) json_encode($payload, JSON_THROW_ON_ERROR));

        return $encoded . '.' . hash_hmac('sha256', $encoded, $this->secret);
    }

    public function verify(string $state): bool
    {
        $parts = explode('.', $state);
        if (count($parts) !== 2) {
            return false;
        }

        [$encoded, $signature] = $parts;
        $expected = hash_hmac('sha256', $encoded, $this->secret);
        if (!hash_equals($expected, $signature)) {
            return false;
        }

        $decoded = base64_decode($encoded, true);
        if ($decoded === false) {
            return false;
        }

        try {
            $payload = json_decode($decoded, true, 3, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return false;
        }

        if (!is_array($payload) || !isset($payload['exp'], $payload['origin'])) {
            return false;
        }

        return is_int($payload['exp']) && $payload['exp'] > time();
    }

    public function extractOrigin(string $state): string
    {
        $parts = explode('.', $state);
        $decoded = base64_decode($parts[0] ?? '', true) ?: '{}';
        $payload = json_decode($decoded, true);

        return is_array($payload) && isset($payload['origin']) && is_string($payload['origin'])
            ? $payload['origin']
            : '';
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
