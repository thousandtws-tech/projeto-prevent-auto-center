package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.model.CustomerSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomerSearchRepository {

    Flux<CustomerEntity> search(Long workshopId, CustomerSearchCriteria criteria, PageQuery pageQuery);

    Mono<Long> count(Long workshopId, CustomerSearchCriteria criteria);
}
