package br.com.tws.msserviceorders.repository;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderCatalogItemEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ServiceOrderCatalogItemRepository extends ReactiveCrudRepository<ServiceOrderCatalogItemEntity, Long> {

    Flux<ServiceOrderCatalogItemEntity> findAllByWorkshopId(Long workshopId);

    Flux<ServiceOrderCatalogItemEntity> findAllByWorkshopIdAndTypeOrderByDescriptionAsc(Long workshopId, String type);

    Mono<ServiceOrderCatalogItemEntity> findByIdAndWorkshopId(Long id, Long workshopId);
}
