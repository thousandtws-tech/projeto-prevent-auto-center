package br.com.tws.msserviceorders.service.impl;

import br.com.tws.msserviceorders.dto.request.ServiceOrderSearchRequest;
import br.com.tws.msserviceorders.dto.request.ServiceOrderUpsertRequest;
import br.com.tws.msserviceorders.dto.request.SignSharedServiceOrderRequest;
import br.com.tws.msserviceorders.dto.response.PageResponse;
import br.com.tws.msserviceorders.dto.response.ServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.ShareServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.SharedServiceOrderResponse;
import br.com.tws.msserviceorders.mapper.ServiceOrderMapper;
import br.com.tws.msserviceorders.security.AuthenticatedWorkshopService;
import br.com.tws.msserviceorders.service.ServiceOrderFacade;
import br.com.tws.msserviceorders.service.ServiceOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ServiceOrderFacadeImpl implements ServiceOrderFacade {

    private final ServiceOrderService serviceOrderService;
    private final ServiceOrderMapper serviceOrderMapper;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @Override
    public Mono<ServiceOrderResponse> create(ServiceOrderUpsertRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderService.create(workshopId, request))
                .map(serviceOrderMapper::toResponse);
    }

    @Override
    public Mono<ServiceOrderResponse> getById(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderService.getById(workshopId, id))
                .map(serviceOrderMapper::toResponse);
    }

    @Override
    public Mono<PageResponse<ServiceOrderResponse>> list(ServiceOrderSearchRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderService.list(
                        workshopId,
                        serviceOrderMapper.toSearchCriteria(request),
                        serviceOrderMapper.toPageQuery(request)
                ))
                .map(serviceOrderMapper::toPageResponse);
    }

    @Override
    public Mono<ServiceOrderResponse> update(Long id, ServiceOrderUpsertRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderService.update(workshopId, id, request))
                .map(serviceOrderMapper::toResponse);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderService.delete(workshopId, id));
    }

    @Override
    public Mono<ShareServiceOrderResponse> share(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> serviceOrderService.share(workshopId, id))
                .map(serviceOrderMapper::toShareResponse);
    }

    @Override
    public Mono<SharedServiceOrderResponse> getSharedByToken(String token) {
        return serviceOrderService.getSharedByToken(token)
                .map(serviceOrderMapper::toSharedResponse);
    }

    @Override
    public Mono<SharedServiceOrderResponse> signByToken(String token, SignSharedServiceOrderRequest request) {
        return serviceOrderService.signByToken(token, request)
                .map(serviceOrderMapper::toSharedResponse);
    }
}
