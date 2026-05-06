package br.com.tws.msserviceorders.repository;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ServiceOrderRepository extends ReactiveCrudRepository<ServiceOrderEntity, Long> {

    Mono<ServiceOrderEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Flux<ServiceOrderEntity> findAllByWorkshopId(Long workshopId);

    Mono<ServiceOrderEntity> findBySignatureToken(String signatureToken);
}
