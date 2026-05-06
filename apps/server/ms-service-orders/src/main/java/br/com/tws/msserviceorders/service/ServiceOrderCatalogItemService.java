package br.com.tws.msserviceorders.service;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderCatalogItemEntity;
import br.com.tws.msserviceorders.dto.request.ServiceOrderCatalogItemUpsertRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ServiceOrderCatalogItemService {

    Mono<ServiceOrderCatalogItemEntity> create(Long workshopId, ServiceOrderCatalogItemUpsertRequest request);

    Flux<ServiceOrderCatalogItemEntity> list(Long workshopId, String type);

    Mono<ServiceOrderCatalogItemEntity> getById(Long workshopId, Long id);

    Mono<ServiceOrderCatalogItemEntity> update(Long workshopId, Long id, ServiceOrderCatalogItemUpsertRequest request);

    Mono<Void> delete(Long workshopId, Long id);
}
