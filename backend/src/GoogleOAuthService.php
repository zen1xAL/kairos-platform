<?php

declare(strict_types=1);

namespace Backend;

use Backend\Dto\GoogleProfile;
use Backend\Dto\TokenPair;

final class GoogleOAuthService
{
    private const AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';

    private const TOKEN_URI = 'https://oauth2.googleapis.com/token';

    private const USERINFO_URI = 'https://openidconnect.googleapis.com/v1/userinfo';

    private const SCOPE = 'openid email profile';

    public function __construct(
        private readonly Config $config
    ) {
    }

    public function buildAuthorizationUrl(string $state): string
    {
        $params = [
            'client_id' => $this->config->clientId(),
            'redirect_uri' => $this->config->redirectUri(),
            'response_type' => 'code',
            'scope' => self::SCOPE,
            'state' => $state,
            'access_type' => 'online',
            'prompt' => 'select_account',
        ];

        return self::AUTH_URI . '?' . http_build_query($params);
    }

    public function exchangeAuthorizationCode(string $code): TokenPair
    {
        $body = $this->postForm(self::TOKEN_URI, [
            'code' => $code,
            'client_id' => $this->config->clientId(),
            'client_secret' => $this->config->clientSecret(),
            'redirect_uri' => $this->config->redirectUri(),
            'grant_type' => 'authorization_code',
        ]);

        $accessToken = $body['access_token'] ?? null;
        $idToken = $body['id_token'] ?? null;
        $expiresIn = $body['expires_in'] ?? null;

        if (!is_string($accessToken) || !is_string($idToken) || !is_int($expiresIn)) {
            throw new OAuthException('Google token response is missing required fields');
        }

        return new TokenPair($accessToken, $idToken, $expiresIn);
    }

    public function fetchProfile(string $accessToken): GoogleProfile
    {
        $body = $this->getJson(self::USERINFO_URI, $accessToken);

        $id = $body['sub'] ?? null;
        $email = $body['email'] ?? null;

        if (!is_string($id) || !is_string($email)) {
            throw new OAuthException('Google profile response is missing required fields');
        }

        return new GoogleProfile(
            $id,
            is_string($body['name'] ?? null) ? $body['name'] : $email,
            $email,
            is_string($body['picture'] ?? null) ? $body['picture'] : ''
        );
    }

    private function postForm(string $url, array $fields): array
    {
        $handle = curl_init($url);
        if ($handle === false) {
            throw new OAuthException('Failed to initialize cURL');
        }

        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($fields),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ]);

        $raw = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        return $this->decodeGoogleResponse($raw, $status, $error, 'token');
    }

    private function getJson(string $url, string $accessToken): array
    {
        $handle = curl_init($url);
        if ($handle === false) {
            throw new OAuthException('Failed to initialize cURL');
        }

        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken],
        ]);

        $raw = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        return $this->decodeGoogleResponse($raw, $status, $error, 'profile');
    }

    private function decodeGoogleResponse(string|bool $raw, int $status, string $curlError, string $context): array
    {
        if ($raw === false || $curlError !== '') {
            throw new OAuthException("Google {$context} request failed: {$curlError}");
        }

        try {
            $decoded = json_decode((string) $raw, true, 4, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new OAuthException("Google {$context} response is not valid JSON");
        }

        if (!is_array($decoded)) {
            throw new OAuthException("Google {$context} response has unexpected format");
        }

        if ($status < 200 || $status >= 300) {
            $description = $decoded['error_description'] ?? ($decoded['error'] ?? ['message' => 'unknown error']);
            if (is_array($description)) {
                $description = $description['message'] ?? 'unknown error';
            }
            throw new OAuthException("Google {$context} request returned status {$status}: {$description}");
        }

        return $decoded;
    }
}
