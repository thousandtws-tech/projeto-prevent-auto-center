package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.domain.model.*;
import reactor.core.publisher.Mono;

public interface VehicleService {

    Mono<VehicleEntity> create(Long workshopId, VehicleCommand command);

    Mono<VehicleEntity> getById(Long workshopId, Long id);

    Mono<PageResult<VehicleEntity>> list(Long workshopId, VehicleSearchCriteria criteria, PageQuery pageQuery);

    Mono<VehicleEntity> update(Long workshopId, Long id, VehicleCommand command);

    Mono<Void> delete(Long workshopId, Long id);
}
