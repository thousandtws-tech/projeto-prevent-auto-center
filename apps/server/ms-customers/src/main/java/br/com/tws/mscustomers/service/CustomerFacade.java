package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.dto.request.CustomerCreateRequest;
import br.com.tws.mscustomers.dto.request.CustomerSearchRequest;
import br.com.tws.mscustomers.dto.request.CustomerUpdateRequest;
import br.com.tws.mscustomers.dto.response.CustomerResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import reactor.core.publisher.Mono;

public interface CustomerFacade {

    Mono<CustomerResponse> create(CustomerCreateRequest request);

    Mono<CustomerResponse> getById(Long id);

    Mono<PageResponse<CustomerResponse>> list(CustomerSearchRequest request);

    Mono<CustomerResponse> update(Long id, CustomerUpdateRequest request);

    Mono<Void> delete(Long id);
}
