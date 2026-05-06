package br.com.tws.msauth.media;

import br.com.tws.msauth.exception.BadRequestException;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class MediaUploadSupport {

    private final CloudinaryProperties properties;

    public MediaUploadSupport(CloudinaryProperties properties) {
        this.properties = properties;
    }

    public Mono<UploadImageCommand> toCommand(FilePart filePart) {
        MediaType contentType = filePart.headers().getContentType();
        if (contentType == null || !"image".equalsIgnoreCase(contentType.getType())) {
            return Mono.error(new BadRequestException("O arquivo enviado deve ser uma imagem."));
        }

        int maxBytes = Math.toIntExact(properties.maxFileSize().toBytes());

        return DataBufferUtils.join(filePart.content(), maxBytes)
                .map(dataBuffer -> {
                    try {
                        byte[] content = new byte[dataBuffer.readableByteCount()];
                        dataBuffer.read(content);
                        if (content.length == 0) {
                            throw new BadRequestException("O arquivo enviado esta vazio.");
                        }

                        return new UploadImageCommand(
                                content,
                                sanitizeFilename(filePart.filename()),
                                contentType.toString()
                        );
                    } finally {
                        DataBufferUtils.release(dataBuffer);
                    }
                })
                .onErrorMap(
                        DataBufferLimitException.class,
                        exception -> new BadRequestException(
                                "O arquivo excede o limite permitido de " + properties.maxFileSize() + "."
                        )
                );
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "upload";
        }

        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
