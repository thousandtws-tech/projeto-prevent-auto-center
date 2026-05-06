package br.com.tws.msscheduling.service.impl;

import br.com.tws.msscheduling.domain.entity.SchedulingAppointmentEntity;
import br.com.tws.msscheduling.domain.model.PageQuery;
import br.com.tws.msscheduling.domain.model.PageResult;
import br.com.tws.msscheduling.domain.model.SchedulingAppointmentSearchCriteria;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentCreateRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentPatchRequest;
import br.com.tws.msscheduling.exception.SchedulingAppointmentNotFoundException;
import br.com.tws.msscheduling.mapper.SchedulingAppointmentMapper;
import br.com.tws.msscheduling.repository.SchedulingAppointmentRepository;
import br.com.tws.msscheduling.repository.SchedulingAppointmentSearchRepository;
import br.com.tws.msscheduling.service.SchedulingAppointmentService;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class SchedulingAppointmentServiceImpl implements SchedulingAppointmentService {

    private final SchedulingAppointmentRepository schedulingAppointmentRepository;
    private final SchedulingAppointmentSearchRepository schedulingAppointmentSearchRepository;
    private final SchedulingAppointmentMapper schedulingAppointmentMapper;
    private final Clock systemClock;

    @Override
    public Mono<SchedulingAppointmentEntity> create(Long workshopId, SchedulingAppointmentCreateRequest request) {
        OffsetDateTime now = OffsetDateTime.now(systemClock).withOffsetSameInstant(ZoneOffset.UTC);
        return schedulingAppointmentRepository.save(schedulingAppointmentMapper.toNewEntity(workshopId, request, now));
    }

    @Override
    public Mono<SchedulingAppointmentEntity> getById(Long workshopId, Long id) {
        return schedulingAppointmentRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new SchedulingAppointmentNotFoundException(id)));
    }

    @Override
    public Mono<PageResult<SchedulingAppointmentEntity>> list(
            Long workshopId,
            SchedulingAppointmentSearchCriteria criteria,
            PageQuery pageQuery
    ) {
        return schedulingAppointmentSearchRepository.search(workshopId, criteria, pageQuery)
                .collectList()
                .zipWith(schedulingAppointmentSearchRepository.count(workshopId, criteria))
                .map(tuple -> PageResult.<SchedulingAppointmentEntity>builder()
                        .content(tuple.getT1())
                        .pageQuery(pageQuery)
                        .totalElements(tuple.getT2())
                        .build());
    }

    @Override
    public Mono<SchedulingAppointmentEntity> update(Long workshopId, Long id, SchedulingAppointmentPatchRequest request) {
        OffsetDateTime now = OffsetDateTime.now(systemClock).withOffsetSameInstant(ZoneOffset.UTC);
        return getById(workshopId, id)
                .map(current -> schedulingAppointmentMapper.merge(current, request, now))
                .flatMap(schedulingAppointmentRepository::save);
    }

    @Override
    public Mono<Void> delete(Long workshopId, Long id) {
        return getById(workshopId, id)
                .flatMap(schedulingAppointmentRepository::delete);
    }

    @Override
    public Mono<Void> clearAll(Long workshopId) {
        return schedulingAppointmentRepository.findAllByWorkshopId(workshopId)
                .flatMap(schedulingAppointmentRepository::delete)
                .then();
    }
}
