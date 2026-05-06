package br.com.tws.msserviceorders.service;

import br.com.tws.msserviceorders.dto.request.ServiceOrderCatalogItemUpsertRequest;
import br.com.tws.msserviceorders.dto.response.ServiceOrderCatalogItemResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ServiceOrderCatalogItemFacade {

    Mono<ServiceOrderCatalogItemResponse> create(ServiceOrderCatalogItemUpsertRequest request);

    Flux<ServiceOrderCatalogItemResponse> list(String type);

    Mono<ServiceOrderCatalogItemResponse> getById(Long id);

    Mono<ServiceOrderCatalogItemResponse> update(Long id, ServiceOrderCatalogItemUpsertRequest request);

    Mono<Void> delete(Long id);
}
