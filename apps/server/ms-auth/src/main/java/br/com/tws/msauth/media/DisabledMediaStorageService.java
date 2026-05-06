package br.com.tws.msauth.media;

import br.com.tws.msauth.exception.ServiceUnavailableException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@ConditionalOnProperty(prefix = "media.cloudinary", name = "enabled", havingValue = "false", matchIfMissing = true)
public class DisabledMediaStorageService implements MediaStorageService {

    @Override
    public Mono<StoredMediaAsset> upload(String publicId, UploadImageCommand command) {
        return Mono.error(new ServiceUnavailableException(
                "Upload de imagens indisponivel. Configure o Cloudinary para habilitar a funcionalidade."
        ));
    }
}
