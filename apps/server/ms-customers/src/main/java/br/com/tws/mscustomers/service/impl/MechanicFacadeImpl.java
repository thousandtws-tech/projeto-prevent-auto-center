package br.com.tws.mscustomers.service.impl;

import br.com.tws.mscustomers.dto.request.MechanicSearchRequest;
import br.com.tws.mscustomers.dto.request.MechanicUpsertRequest;
import br.com.tws.mscustomers.dto.response.MechanicResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.mapper.MechanicMapper;
import br.com.tws.mscustomers.security.AuthenticatedWorkshopService;
import br.com.tws.mscustomers.service.MechanicFacade;
import br.com.tws.mscustomers.service.MechanicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class MechanicFacadeImpl implements MechanicFacade {

    private final MechanicService mechanicService;
    private final MechanicMapper mechanicMapper;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @Override
    public Mono<MechanicResponse> create(MechanicUpsertRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> mechanicService.create(workshopId, request))
                .map(mechanicMapper::toResponse);
    }

    @Override
    public Mono<MechanicResponse> getById(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> mechanicService.getById(workshopId, id))
                .map(mechanicMapper::toResponse);
    }

    @Override
    public Mono<PageResponse<MechanicResponse>> list(MechanicSearchRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> mechanicService.list(
                        workshopId,
                        mechanicMapper.toSearchCriteria(request),
                        mechanicMapper.toPageQuery(request)
                ))
                .map(mechanicMapper::toPageResponse);
    }

    @Override
    public Mono<MechanicResponse> update(Long id, MechanicUpsertRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> mechanicService.update(workshopId, id, request))
                .map(mechanicMapper::toResponse);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> mechanicService.delete(workshopId, id));
    }
}

