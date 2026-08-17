<?php

declare(strict_types=1);

namespace Backend\Dto;

final readonly class GoogleProfile
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public string $pictureUrl
    ) {
    }
}
