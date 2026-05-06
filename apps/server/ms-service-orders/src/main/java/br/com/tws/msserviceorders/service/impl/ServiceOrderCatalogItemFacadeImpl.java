package br.com.tws.msserviceorders.service.impl;

import br.com.tws.msserviceorders.dto.request.ServiceOrderCatalogItemUpsertRequest;
import br.com.tws.msserviceorders.dto.response.ServiceOrderCatalogItemResponse;
import br.com.tws.msserviceorders.mapper.ServiceOrderCatalogItemMapper;
import br.com.tws.msserviceorders.security.AuthenticatedWorkshopService;
import br.com.tws.msserviceorders.service.ServiceOrderCatalogItemFacade;
import br.com.tws.msserviceorders.service.ServiceOrderCatalogItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ServiceOrderCatalogItemFacadeImpl implements ServiceOrderCatalogItemFacade {

    private final ServiceOrderCatalogItemService serviceOrderCatalogItemService;
    private final ServiceOrderCatalogItemMapper serviceOrderCatalogItemMapper;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @Override
    public Mono<ServiceOrderCatalogItemResponse> create(ServiceOrderCatalogItemUpsertRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderCatalogItemService.create(workshopId, request))
                .map(serviceOrderCatalogItemMapper::toResponse);
    }

    @Override
    public Flux<ServiceOrderCatalogItemResponse> list(String type) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMapMany(workshopId -> serviceOrderCatalogItemService.list(workshopId, type))
                .map(serviceOrderCatalogItemMapper::toResponse);
    }

    @Override
    public Mono<ServiceOrderCatalogItemResponse> getById(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderCatalogItemService.getById(workshopId, id))
                .map(serviceOrderCatalogItemMapper::toResponse);
    }

    @Override
    public Mono<ServiceOrderCatalogItemResponse> update(Long id, ServiceOrderCatalogItemUpsertRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderCatalogItemService.update(workshopId, id, request))
                .map(serviceOrderCatalogItemMapper::toResponse);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderCatalogItemService.delete(workshopId, id));
    }
}
