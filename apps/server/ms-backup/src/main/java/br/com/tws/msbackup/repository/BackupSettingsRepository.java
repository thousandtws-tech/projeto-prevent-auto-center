package br.com.tws.msbackup.repository;

import br.com.tws.msbackup.domain.entity.BackupSettingsEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface BackupSettingsRepository extends ReactiveCrudRepository<BackupSettingsEntity, Long> {

    Mono<BackupSettingsEntity> findByWorkshopId(Long workshopId);

    Flux<BackupSettingsEntity> findAllByAutomaticEnabledTrue();
}
