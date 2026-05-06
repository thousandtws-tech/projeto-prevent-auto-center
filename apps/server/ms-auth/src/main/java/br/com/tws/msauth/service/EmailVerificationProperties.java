package br.com.tws.msauth.service;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth.email-verification")
public record EmailVerificationProperties(
        String mailFrom,
        String verifyUrlBase,
        String redirectUrl,
        Duration tokenTtl
) {
}
