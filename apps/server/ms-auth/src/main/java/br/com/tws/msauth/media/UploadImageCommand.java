package br.com.tws.msauth.media;

public record UploadImageCommand(
        byte[] content,
        String originalFilename,
        String contentType
) {
}
