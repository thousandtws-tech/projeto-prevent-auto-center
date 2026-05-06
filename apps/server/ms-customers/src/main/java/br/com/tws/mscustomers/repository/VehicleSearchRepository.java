package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.VehicleSearchCriteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface VehicleSearchRepository {

    Flux<VehicleEntity> search(Long workshopId, VehicleSearchCriteria criteria, PageQuery pageQuery);

    Mono<Long> count(Long workshopId, VehicleSearchCriteria criteria);
}
