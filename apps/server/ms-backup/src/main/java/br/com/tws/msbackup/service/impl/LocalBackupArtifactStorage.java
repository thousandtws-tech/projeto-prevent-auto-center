package br.com.tws.msbackup.service.impl;

import br.com.tws.msbackup.config.BackupProperties;
import br.com.tws.msbackup.domain.model.StoredBackupArtifact;
import br.com.tws.msbackup.service.BackupArtifactStorage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
public class LocalBackupArtifactStorage implements BackupArtifactStorage {

    private final BackupProperties backupProperties;

    @Override
    public Mono<StoredBackupArtifact> store(Long workshopId, Long backupRunId, String fileName, byte[] content) {
        return Mono.fromCallable(() -> {
                    Path basePath = resolveBasePath();
                    Path relativePath = Path.of("workshop-" + workshopId, "run-" + backupRunId + "-" + fileName);
                    Path absolutePath = resolveStoragePath(basePath, relativePath.toString());

                    Files.createDirectories(basePath);
                    Files.createDirectories(absolutePath.getParent());
                    Files.write(
                            absolutePath,
                            content,
                            StandardOpenOption.CREATE,
                            StandardOpenOption.TRUNCATE_EXISTING,
                            StandardOpenOption.WRITE
                    );

                    return new StoredBackupArtifact(relativePath.toString(), fileName);
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Mono<Resource> load(String storagePath) {
        return Mono.fromCallable(() -> {
                    Path absolutePath = resolveStoragePath(resolveBasePath(), storagePath);
                    if (!Files.exists(absolutePath)) {
                        throw new IllegalStateException("Arquivo de backup nao encontrado no armazenamento configurado.");
                    }
                    return (Resource) new FileSystemResource(absolutePath);
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    private Path resolveBasePath() {
        return Path.of(backupProperties.getStorageBasePath()).toAbsolutePath().normalize();
    }

    private Path resolveStoragePath(Path basePath, String storagePath) {
        Path absolutePath = basePath.resolve(storagePath).normalize();
        if (!absolutePath.startsWith(basePath)) {
            throw new IllegalStateException("Caminho de armazenamento de backup invalido.");
        }
        return absolutePath;
    }
}
