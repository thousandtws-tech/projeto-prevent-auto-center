package br.com.tws.msscheduling.repository;

import br.com.tws.msscheduling.domain.entity.SchedulingAppointmentEntity;
import br.com.tws.msscheduling.domain.model.PageQuery;
import br.com.tws.msscheduling.domain.model.SchedulingAppointmentSearchCriteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SchedulingAppointmentSearchRepository {

    Flux<SchedulingAppointmentEntity> search(Long workshopId, SchedulingAppointmentSearchCriteria criteria, PageQuery pageQuery);

    Mono<Long> count(Long workshopId, SchedulingAppointmentSearchCriteria criteria);
}
