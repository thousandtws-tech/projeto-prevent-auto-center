package br.com.tws.msauth.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CloudinaryConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "media.cloudinary", name = "enabled", havingValue = "true")
    Cloudinary cloudinary(CloudinaryProperties properties) {
        if (!properties.isConfigured()) {
            throw new IllegalStateException("Cloudinary habilitado sem cloud name, api key ou api secret.");
        }

        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", properties.cloudName(),
                "api_key", properties.apiKey(),
                "api_secret", properties.apiSecret(),
                "secure", true
        ));
    }
}
