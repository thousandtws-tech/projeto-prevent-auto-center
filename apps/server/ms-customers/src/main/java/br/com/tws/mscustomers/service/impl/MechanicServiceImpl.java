package br.com.tws.mscustomers.service.impl;

import br.com.tws.mscustomers.domain.entity.MechanicEntity;
import br.com.tws.mscustomers.domain.model.MechanicSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.PageResult;
import br.com.tws.mscustomers.dto.request.MechanicUpsertRequest;
import br.com.tws.mscustomers.exception.MechanicNotFoundException;
import br.com.tws.mscustomers.mapper.MechanicMapper;
import br.com.tws.mscustomers.repository.MechanicRepository;
import br.com.tws.mscustomers.repository.MechanicSearchRepository;
import br.com.tws.mscustomers.service.MechanicService;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class MechanicServiceImpl implements MechanicService {

    private final MechanicRepository mechanicRepository;
    private final MechanicSearchRepository mechanicSearchRepository;
    private final MechanicMapper mechanicMapper;

    @Override
    public Mono<MechanicEntity> create(Long workshopId, MechanicUpsertRequest request) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return mechanicRepository.save(mechanicMapper.toNewEntity(workshopId, request, now));
    }

    @Override
    public Mono<MechanicEntity> getById(Long workshopId, Long id) {
        return mechanicRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new MechanicNotFoundException(id)));
    }

    @Override
    public Mono<PageResult<MechanicEntity>> list(Long workshopId, MechanicSearchCriteria criteria, PageQuery pageQuery) {
        return Mono.zip(
                        mechanicSearchRepository.search(workshopId, criteria, pageQuery).collectList(),
                        mechanicSearchRepository.count(workshopId, criteria)
                )
                .map(tuple -> PageResult.<MechanicEntity>builder()
                        .content(tuple.getT1())
                        .totalElements(tuple.getT2())
                        .pageQuery(pageQuery)
                        .build());
    }

    @Override
    public Mono<MechanicEntity> update(Long workshopId, Long id, MechanicUpsertRequest request) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return getById(workshopId, id)
                .map(current -> mechanicMapper.merge(current, request, now))
                .flatMap(mechanicRepository::save);
    }

    @Override
    public Mono<Void> delete(Long workshopId, Long id) {
        return getById(workshopId, id)
                .flatMap(mechanicRepository::delete);
    }
}

