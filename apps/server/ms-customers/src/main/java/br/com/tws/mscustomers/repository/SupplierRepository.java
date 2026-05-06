package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.SupplierEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SupplierRepository extends ReactiveCrudRepository<SupplierEntity, Long> {

    Mono<SupplierEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Flux<SupplierEntity> findAllByWorkshopId(Long workshopId);

    Mono<Boolean> existsByWorkshopIdAndDocumentAndIdNot(Long workshopId, String document, Long id);
}
