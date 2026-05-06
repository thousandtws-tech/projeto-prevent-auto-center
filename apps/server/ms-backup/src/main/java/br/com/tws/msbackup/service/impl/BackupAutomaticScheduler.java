package br.com.tws.msbackup.service.impl;

import br.com.tws.msbackup.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BackupAutomaticScheduler {

    private final BackupService backupService;

    @Scheduled(
            fixedDelayString = "${backup.scheduler.fixed-delay-ms:300000}",
            initialDelayString = "${backup.scheduler.initial-delay-ms:60000}"
    )
    public void processAutomaticBackups() {
        backupService.processDueAutomaticBackups()
                .doOnError(exception -> log.error("Falha ao processar backups automaticos pendentes.", exception))
                .onErrorResume(exception -> reactor.core.publisher.Mono.empty())
                .subscribe();
    }
}
