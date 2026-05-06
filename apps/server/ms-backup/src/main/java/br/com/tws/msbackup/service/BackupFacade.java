package br.com.tws.msbackup.service;

import br.com.tws.msbackup.domain.model.BackupDownloadArtifact;
import br.com.tws.msbackup.dto.response.BackupImportResponse;
import br.com.tws.msbackup.dto.request.BackupSettingsUpdateRequest;
import br.com.tws.msbackup.dto.response.BackupRunResponse;
import br.com.tws.msbackup.dto.response.BackupSettingsResponse;
import java.util.List;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

public interface BackupFacade {

    Mono<BackupSettingsResponse> getSettings();

    Mono<BackupSettingsResponse> updateSettings(BackupSettingsUpdateRequest request);

    Mono<BackupRunResponse> runManualBackup();

    Mono<List<BackupRunResponse>> listHistory(int limit);

    Mono<BackupDownloadArtifact> download(Long backupRunId);

    Mono<BackupImportResponse> importBackup(FilePart filePart);
}
