package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.MechanicEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface MechanicRepository extends ReactiveCrudRepository<MechanicEntity, Long> {

    Mono<MechanicEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Flux<MechanicEntity> findAllByWorkshopId(Long workshopId);
}

