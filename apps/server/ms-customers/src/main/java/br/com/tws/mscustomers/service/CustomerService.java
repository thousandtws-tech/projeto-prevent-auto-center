package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.model.CustomerCommand;
import br.com.tws.mscustomers.domain.model.CustomerSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.PageResult;
import reactor.core.publisher.Mono;

public interface CustomerService {

    Mono<CustomerEntity> create(Long workshopId, CustomerCommand command);

    Mono<CustomerEntity> getById(Long workshopId, Long id);

    Mono<PageResult<CustomerEntity>> list(Long workshopId, CustomerSearchCriteria criteria, PageQuery pageQuery);

    Mono<CustomerEntity> update(Long workshopId, Long id, CustomerCommand command);

    Mono<Void> delete(Long workshopId, Long id);
}
