package br.com.tws.msauth.repository;

import br.com.tws.msauth.domain.entity.WorkshopEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface WorkshopRepository extends ReactiveCrudRepository<WorkshopEntity, Long> {

    Mono<Boolean> existsBySlug(String slug);

    Mono<WorkshopEntity> findBySlug(String slug);
}
