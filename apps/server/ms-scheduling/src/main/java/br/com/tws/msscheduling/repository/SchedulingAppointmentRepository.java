package br.com.tws.msscheduling.repository;

import br.com.tws.msscheduling.domain.entity.SchedulingAppointmentEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface SchedulingAppointmentRepository extends ReactiveCrudRepository<SchedulingAppointmentEntity, Long> {

    Mono<SchedulingAppointmentEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Flux<SchedulingAppointmentEntity> findAllByWorkshopId(Long workshopId);
}
