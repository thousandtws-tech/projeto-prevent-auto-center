package br.com.tws.msserviceorders.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "service-orders")
public record ServiceOrdersProperties(
        String publicSignatureBaseUrl
) {
}
