package br.com.tws.msbackup.service;

import br.com.tws.msbackup.domain.model.BackupDownloadArtifact;
import br.com.tws.msbackup.dto.request.BackupSettingsUpdateRequest;
import br.com.tws.msbackup.dto.response.BackupImportResponse;
import br.com.tws.msbackup.dto.response.BackupRunResponse;
import br.com.tws.msbackup.dto.response.BackupSettingsResponse;
import br.com.tws.msbackup.security.AuthenticatedBackupContext;
import java.util.List;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

public interface BackupService {

    Mono<BackupSettingsResponse> getSettings(Long workshopId);

    Mono<BackupSettingsResponse> updateSettings(Long workshopId, BackupSettingsUpdateRequest request);

    Mono<BackupRunResponse> runManualBackup(AuthenticatedBackupContext context);

    Mono<List<BackupRunResponse>> listHistory(Long workshopId, int limit);

    Mono<BackupDownloadArtifact> download(Long workshopId, Long backupRunId);

    Mono<BackupImportResponse> importBackup(AuthenticatedBackupContext context, FilePart filePart);

    Mono<Void> processDueAutomaticBackups();
}
