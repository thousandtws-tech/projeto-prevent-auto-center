package br.com.tws.msauth.security;

import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        @NotBlank String secret,
        Duration accessTokenTtl,
        Duration refreshTokenTtl
) {
}
