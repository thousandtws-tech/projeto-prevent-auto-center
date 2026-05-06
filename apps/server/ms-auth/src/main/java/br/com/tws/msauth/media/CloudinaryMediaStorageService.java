package br.com.tws.msauth.media;

import br.com.tws.msauth.exception.ServiceUnavailableException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@ConditionalOnProperty(prefix = "media.cloudinary", name = "enabled", havingValue = "true")
public class CloudinaryMediaStorageService implements MediaStorageService {

    private final Cloudinary cloudinary;
    private final CloudinaryProperties properties;

    public CloudinaryMediaStorageService(Cloudinary cloudinary, CloudinaryProperties properties) {
        this.cloudinary = cloudinary;
        this.properties = properties;
    }

    @Override
    public Mono<StoredMediaAsset> upload(String publicId, UploadImageCommand command) {
        return Mono.fromCallable(() -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> response = cloudinary.uploader().upload(
                            command.content(),
                            ObjectUtils.asMap(
                                    "public_id", buildPublicId(publicId),
                                    "resource_type", "image",
                                    "overwrite", true,
                                    "invalidate", true,
                                    "filename_override", command.originalFilename()
                            )
                    );

                    Object secureUrl = response.get("secure_url");
                    if (!(secureUrl instanceof String url) || url.isBlank()) {
                        throw new ServiceUnavailableException("Cloudinary nao retornou a URL da imagem enviada.");
                    }

                    return new StoredMediaAsset(url);
                })
                .onErrorMap(
                        exception -> !(exception instanceof ServiceUnavailableException),
                        exception -> new ServiceUnavailableException("Falha ao enviar imagem para o Cloudinary.", exception)
                )
                .subscribeOn(Schedulers.boundedElastic());
    }

    private String buildPublicId(String publicId) {
        return properties.baseFolder() + "/" + publicId;
    }
}
