package br.com.tws.mscustomers.service.impl;

import br.com.tws.mscustomers.dto.request.VehicleCreateRequest;
import br.com.tws.mscustomers.dto.request.VehicleSearchRequest;
import br.com.tws.mscustomers.dto.request.VehicleUpdateRequest;
import br.com.tws.mscustomers.dto.response.VehicleResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.mapper.VehicleMapper;
import br.com.tws.mscustomers.security.AuthenticatedWorkshopService;
import br.com.tws.mscustomers.service.VehicleFacade;
import br.com.tws.mscustomers.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class VehicleFacadeImpl implements VehicleFacade {

    private final VehicleService vehicleService;
    private final VehicleMapper vehicleMapper;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @Override
    public Mono<VehicleResponse> create(VehicleCreateRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> vehicleService.create(workshopId, vehicleMapper.toCommand(request)))
                .map(vehicleMapper::toResponse);
    }

    @Override
    public Mono<VehicleResponse> getById(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> vehicleService.getById(workshopId, id))
                .map(vehicleMapper::toResponse);
    }

    @Override
    public Mono<PageResponse<VehicleResponse>> list(VehicleSearchRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> vehicleService.list(
                        workshopId,
                        vehicleMapper.toSearchCriteria(request),
                        vehicleMapper.toPageQuery(request)
                ))
                .map(vehicleMapper::toPageResponse);
    }

    @Override
    public Mono<VehicleResponse> update(Long id, VehicleUpdateRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> vehicleService.update(workshopId, id, vehicleMapper.toCommand(request)))
                .map(vehicleMapper::toResponse);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> vehicleService.delete(workshopId, id));
    }

}
