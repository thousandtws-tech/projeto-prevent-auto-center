package br.com.tws.msserviceorders.repository;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderEntity;
import br.com.tws.msserviceorders.domain.model.PageQuery;
import br.com.tws.msserviceorders.domain.model.ServiceOrderSearchCriteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ServiceOrderSearchRepository {

    Flux<ServiceOrderEntity> search(Long workshopId, ServiceOrderSearchCriteria criteria, PageQuery pageQuery);

    Mono<Long> count(Long workshopId, ServiceOrderSearchCriteria criteria);
}
