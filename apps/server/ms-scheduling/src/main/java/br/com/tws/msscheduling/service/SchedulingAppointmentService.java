package br.com.tws.msscheduling.service;

import br.com.tws.msscheduling.domain.entity.SchedulingAppointmentEntity;
import br.com.tws.msscheduling.domain.model.PageQuery;
import br.com.tws.msscheduling.domain.model.PageResult;
import br.com.tws.msscheduling.domain.model.SchedulingAppointmentSearchCriteria;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentCreateRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentPatchRequest;
import reactor.core.publisher.Mono;

public interface SchedulingAppointmentService {

    Mono<SchedulingAppointmentEntity> create(Long workshopId, SchedulingAppointmentCreateRequest request);

    Mono<SchedulingAppointmentEntity> getById(Long workshopId, Long id);

    Mono<PageResult<SchedulingAppointmentEntity>> list(
            Long workshopId,
            SchedulingAppointmentSearchCriteria criteria,
            PageQuery pageQuery
    );

    Mono<SchedulingAppointmentEntity> update(Long workshopId, Long id, SchedulingAppointmentPatchRequest request);

    Mono<Void> delete(Long workshopId, Long id);

    Mono<Void> clearAll(Long workshopId);
}
