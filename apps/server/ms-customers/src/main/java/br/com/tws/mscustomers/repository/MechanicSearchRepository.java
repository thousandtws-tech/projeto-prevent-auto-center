package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.MechanicEntity;
import br.com.tws.mscustomers.domain.model.MechanicSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface MechanicSearchRepository {

    Flux<MechanicEntity> search(Long workshopId, MechanicSearchCriteria criteria, PageQuery pageQuery);

    Mono<Long> count(Long workshopId, MechanicSearchCriteria criteria);
}

