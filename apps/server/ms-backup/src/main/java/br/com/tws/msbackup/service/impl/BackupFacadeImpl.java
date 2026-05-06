package br.com.tws.msbackup.service.impl;

import br.com.tws.msbackup.domain.model.BackupDownloadArtifact;
import br.com.tws.msbackup.dto.request.BackupSettingsUpdateRequest;
import br.com.tws.msbackup.dto.response.BackupImportResponse;
import br.com.tws.msbackup.dto.response.BackupRunResponse;
import br.com.tws.msbackup.dto.response.BackupSettingsResponse;
import br.com.tws.msbackup.security.AuthenticatedBackupService;
import br.com.tws.msbackup.service.BackupFacade;
import br.com.tws.msbackup.service.BackupService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class BackupFacadeImpl implements BackupFacade {

    private final BackupService backupService;
    private final AuthenticatedBackupService authenticatedBackupService;

    @Override
    public Mono<BackupSettingsResponse> getSettings() {
        return authenticatedBackupService.getRequiredPrivilegedContext()
                .flatMap(context -> backupService.getSettings(context.workshopId()));
    }

    @Override
    public Mono<BackupSettingsResponse> updateSettings(BackupSettingsUpdateRequest request) {
        return authenticatedBackupService.getRequiredPrivilegedContext()
                .flatMap(context -> backupService.updateSettings(context.workshopId(), request));
    }

    @Override
    public Mono<BackupRunResponse> runManualBackup() {
        return authenticatedBackupService.getRequiredPrivilegedContext()
                .flatMap(backupService::runManualBackup);
    }

    @Override
    public Mono<List<BackupRunResponse>> listHistory(int limit) {
        return authenticatedBackupService.getRequiredPrivilegedContext()
                .flatMap(context -> backupService.listHistory(context.workshopId(), limit));
    }

    @Override
    public Mono<BackupDownloadArtifact> download(Long backupRunId) {
        return authenticatedBackupService.getRequiredPrivilegedContext()
                .flatMap(context -> backupService.download(context.workshopId(), backupRunId));
    }

    @Override
    public Mono<BackupImportResponse> importBackup(FilePart filePart) {
        return authenticatedBackupService.getRequiredPrivilegedContext()
                .flatMap(context -> backupService.importBackup(context, filePart));
    }
}
