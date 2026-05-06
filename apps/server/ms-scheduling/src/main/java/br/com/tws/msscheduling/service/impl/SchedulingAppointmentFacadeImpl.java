package br.com.tws.msscheduling.service.impl;

import br.com.tws.msscheduling.dto.request.SchedulingAppointmentCreateRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentPatchRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentSearchRequest;
import br.com.tws.msscheduling.dto.response.PageResponse;
import br.com.tws.msscheduling.dto.response.SchedulingAppointmentResponse;
import br.com.tws.msscheduling.mapper.SchedulingAppointmentMapper;
import br.com.tws.msscheduling.security.AuthenticatedWorkshopService;
import br.com.tws.msscheduling.service.SchedulingAppointmentFacade;
import br.com.tws.msscheduling.service.SchedulingAppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class SchedulingAppointmentFacadeImpl implements SchedulingAppointmentFacade {

    private final SchedulingAppointmentService schedulingAppointmentService;
    private final SchedulingAppointmentMapper schedulingAppointmentMapper;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @Override
    public Mono<SchedulingAppointmentResponse> create(SchedulingAppointmentCreateRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> schedulingAppointmentService.create(workshopId, request))
                .map(schedulingAppointmentMapper::toResponse);
    }

    @Override
    public Mono<SchedulingAppointmentResponse> getById(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> schedulingAppointmentService.getById(workshopId, id))
                .map(schedulingAppointmentMapper::toResponse);
    }

    @Override
    public Mono<PageResponse<SchedulingAppointmentResponse>> list(SchedulingAppointmentSearchRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> schedulingAppointmentService.list(
                        workshopId,
                        schedulingAppointmentMapper.toSearchCriteria(request),
                        schedulingAppointmentMapper.toPageQuery(request)
                ))
                .map(schedulingAppointmentMapper::toPageResponse);
    }

    @Override
    public Mono<SchedulingAppointmentResponse> update(Long id, SchedulingAppointmentPatchRequest request) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> schedulingAppointmentService.update(workshopId, id, request))
                .map(schedulingAppointmentMapper::toResponse);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> schedulingAppointmentService.delete(workshopId, id));
    }

    @Override
    public Mono<Void> clearAll() {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(schedulingAppointmentService::clearAll);
    }
}
