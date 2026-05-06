package br.com.tws.msbackup.service;

import br.com.tws.msbackup.domain.model.StoredBackupArtifact;
import org.springframework.core.io.Resource;
import reactor.core.publisher.Mono;

public interface BackupArtifactStorage {

    Mono<StoredBackupArtifact> store(Long workshopId, Long backupRunId, String fileName, byte[] content);

    Mono<Resource> load(String storagePath);
}
