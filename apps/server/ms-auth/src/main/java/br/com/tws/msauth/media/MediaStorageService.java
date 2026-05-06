package br.com.tws.msauth.media;

import reactor.core.publisher.Mono;

public interface MediaStorageService {

    Mono<StoredMediaAsset> upload(String publicId, UploadImageCommand command);
}
