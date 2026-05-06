package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface VehicleRepository extends ReactiveCrudRepository<VehicleEntity, Long> {

    Mono<VehicleEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Flux<VehicleEntity> findAllByWorkshopId(Long workshopId);

    Mono<Boolean> existsByWorkshopIdAndPlate(Long workshopId, String plate);

    Mono<Boolean> existsByWorkshopIdAndPlateAndIdNot(Long workshopId, String plate, Long id);

    Mono<Boolean> existsByWorkshopIdAndChassisNumber(Long workshopId, String chassisNumber);

    Mono<Boolean> existsByWorkshopIdAndChassisNumberAndIdNot(Long workshopId, String chassisNumber, Long id);
}
