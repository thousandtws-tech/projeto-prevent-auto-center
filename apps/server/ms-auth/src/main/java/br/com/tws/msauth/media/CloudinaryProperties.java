package br.com.tws.msauth.media;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "media.cloudinary")
public record CloudinaryProperties(
        boolean enabled,
        String cloudName,
        String apiKey,
        String apiSecret,
        @NotBlank String baseFolder,
        DataSize maxFileSize
) {

    public boolean isConfigured() {
        return hasText(cloudName) && hasText(apiKey) && hasText(apiSecret);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
