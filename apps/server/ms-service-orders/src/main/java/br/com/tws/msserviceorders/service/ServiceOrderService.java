package br.com.tws.msserviceorders.service;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderEntity;
import br.com.tws.msserviceorders.domain.model.PageQuery;
import br.com.tws.msserviceorders.domain.model.PageResult;
import br.com.tws.msserviceorders.domain.model.ServiceOrderSearchCriteria;
import br.com.tws.msserviceorders.dto.request.ServiceOrderUpsertRequest;
import br.com.tws.msserviceorders.dto.request.SignSharedServiceOrderRequest;
import reactor.core.publisher.Mono;

public interface ServiceOrderService {

    Mono<ServiceOrderEntity> create(Long workshopId, ServiceOrderUpsertRequest request);

    Mono<ServiceOrderEntity> getById(Long workshopId, Long id);

    Mono<PageResult<ServiceOrderEntity>> list(Long workshopId, ServiceOrderSearchCriteria criteria, PageQuery pageQuery);

    Mono<ServiceOrderEntity> update(Long workshopId, Long id, ServiceOrderUpsertRequest request);

    Mono<Void> delete(Long workshopId, Long id);

    Mono<ServiceOrderEntity> share(Long workshopId, Long id);

    Mono<ServiceOrderEntity> getSharedByToken(String token);

    Mono<ServiceOrderEntity> signByToken(String token, SignSharedServiceOrderRequest request);
}
