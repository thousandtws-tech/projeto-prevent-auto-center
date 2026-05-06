package br.com.tws.msbackup.domain.model;

public record StoredBackupArtifact(
        String storagePath,
        String fileName
) {
}
