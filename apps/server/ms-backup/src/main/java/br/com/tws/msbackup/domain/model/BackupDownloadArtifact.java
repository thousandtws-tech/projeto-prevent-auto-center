package br.com.tws.msbackup.domain.model;

import org.springframework.core.io.Resource;

public record BackupDownloadArtifact(
        String fileName,
        long fileSizeBytes,
        Resource resource
) {
}
