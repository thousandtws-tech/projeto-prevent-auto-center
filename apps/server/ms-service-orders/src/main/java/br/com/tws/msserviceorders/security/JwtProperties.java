package br.com.tws.msserviceorders.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        String secret
) {
}
