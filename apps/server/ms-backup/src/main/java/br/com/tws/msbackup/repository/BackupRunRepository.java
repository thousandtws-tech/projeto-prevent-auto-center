package br.com.tws.msbackup.repository;

import br.com.tws.msbackup.domain.entity.BackupRunEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface BackupRunRepository extends ReactiveCrudRepository<BackupRunEntity, Long> {

    Flux<BackupRunEntity> findAllByWorkshopIdOrderByStartedAtDesc(Long workshopId);

    Mono<BackupRunEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Mono<BackupRunEntity> findFirstByWorkshopIdAndStatusOrderByCompletedAtDesc(Long workshopId, String status);
}
