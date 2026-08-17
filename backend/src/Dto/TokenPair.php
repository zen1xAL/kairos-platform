<?php

declare(strict_types=1);

namespace Backend\Dto;

final readonly class TokenPair
{
    public function __construct(
        public string $accessToken,
        public string $idToken,
        public int $expiresIn
    ) {
    }
}
