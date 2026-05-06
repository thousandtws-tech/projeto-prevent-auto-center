package br.com.tws.msscheduling.service;

import br.com.tws.msscheduling.dto.request.SchedulingAppointmentCreateRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentPatchRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentSearchRequest;
import br.com.tws.msscheduling.dto.response.PageResponse;
import br.com.tws.msscheduling.dto.response.SchedulingAppointmentResponse;
import reactor.core.publisher.Mono;

public interface SchedulingAppointmentFacade {

    Mono<SchedulingAppointmentResponse> create(SchedulingAppointmentCreateRequest request);

    Mono<SchedulingAppointmentResponse> getById(Long id);

    Mono<PageResponse<SchedulingAppointmentResponse>> list(SchedulingAppointmentSearchRequest request);

    Mono<SchedulingAppointmentResponse> update(Long id, SchedulingAppointmentPatchRequest request);

    Mono<Void> delete(Long id);

    Mono<Void> clearAll();
}
