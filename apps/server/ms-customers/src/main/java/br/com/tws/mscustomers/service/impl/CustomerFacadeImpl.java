package br.com.tws.mscustomers.service.impl;

import br.com.tws.mscustomers.dto.request.CustomerCreateRequest;
import br.com.tws.mscustomers.dto.request.CustomerSearchRequest;
import br.com.tws.mscustomers.dto.request.CustomerUpdateRequest;
import br.com.tws.mscustomers.dto.response.CustomerResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.mapper.CustomerMapper;
import br.com.tws.mscustomers.security.AuthenticatedWorkshopService;
import br.com.tws.mscustomers.service.CustomerFacade;
import br.com.tws.mscustomers.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class CustomerFacadeImpl implements CustomerFacade {

    private final CustomerService customerService;
    private final CustomerMapper customerMapper;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @Override
    public Mono<CustomerResponse> create(CustomerCreateRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> customerService.create(workshopId, customerMapper.toCommand(request)))
                .map(customerMapper::toResponse);
    }

    @Override
    public Mono<CustomerResponse> getById(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> customerService.getById(workshopId, id))
                .map(customerMapper::toResponse);
    }

    @Override
    public Mono<PageResponse<CustomerResponse>> list(CustomerSearchRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> customerService.list(
                        workshopId,
                        customerMapper.toSearchCriteria(request),
                        customerMapper.toPageQuery(request)
                ))
                .map(customerMapper::toPageResponse);
    }

    @Override
    public Mono<CustomerResponse> update(Long id, CustomerUpdateRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> customerService.update(workshopId, id, customerMapper.toCommand(request)))
                .map(customerMapper::toResponse);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> customerService.delete(workshopId, id));
    }
}
