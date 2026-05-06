package br.com.tws.msserviceorders.service;

import br.com.tws.msserviceorders.dto.request.ServiceOrderSearchRequest;
import br.com.tws.msserviceorders.dto.request.ServiceOrderUpsertRequest;
import br.com.tws.msserviceorders.dto.request.SignSharedServiceOrderRequest;
import br.com.tws.msserviceorders.dto.response.PageResponse;
import br.com.tws.msserviceorders.dto.response.ServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.ShareServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.SharedServiceOrderResponse;
import reactor.core.publisher.Mono;

public interface ServiceOrderFacade {

    Mono<ServiceOrderResponse> create(ServiceOrderUpsertRequest request);

    Mono<ServiceOrderResponse> getById(Long id);

    Mono<PageResponse<ServiceOrderResponse>> list(ServiceOrderSearchRequest request);

    Mono<ServiceOrderResponse> update(Long id, ServiceOrderUpsertRequest request);

    Mono<Void> delete(Long id);

    Mono<ShareServiceOrderResponse> share(Long id);

    Mono<SharedServiceOrderResponse> getSharedByToken(String token);

    Mono<SharedServiceOrderResponse> signByToken(String token, SignSharedServiceOrderRequest request);
}
