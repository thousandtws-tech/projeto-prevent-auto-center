package br.com.tws.msbackup.domain.model;

public record BackupArchive(
        String fileName,
        byte[] bytes,
        long sizeBytes,
        String checksumSha256
) {
}
