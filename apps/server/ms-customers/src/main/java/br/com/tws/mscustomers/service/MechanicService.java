package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.domain.entity.MechanicEntity;
import br.com.tws.mscustomers.domain.model.MechanicSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.PageResult;
import br.com.tws.mscustomers.dto.request.MechanicUpsertRequest;
import reactor.core.publisher.Mono;

public interface MechanicService {

    Mono<MechanicEntity> create(Long workshopId, MechanicUpsertRequest request);

    Mono<MechanicEntity> getById(Long workshopId, Long id);

    Mono<PageResult<MechanicEntity>> list(Long workshopId, MechanicSearchCriteria criteria, PageQuery pageQuery);

    Mono<MechanicEntity> update(Long workshopId, Long id, MechanicUpsertRequest request);

    Mono<Void> delete(Long workshopId, Long id);
}

