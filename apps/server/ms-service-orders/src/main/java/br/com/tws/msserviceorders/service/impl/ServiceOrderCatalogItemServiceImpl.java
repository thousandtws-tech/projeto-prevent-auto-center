package br.com.tws.msserviceorders.service.impl;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderCatalogItemEntity;
import br.com.tws.msserviceorders.dto.request.ServiceOrderCatalogItemUpsertRequest;
import br.com.tws.msserviceorders.exception.ServiceOrderCatalogItemNotFoundException;
import br.com.tws.msserviceorders.mapper.ServiceOrderCatalogItemMapper;
import br.com.tws.msserviceorders.repository.ServiceOrderCatalogItemRepository;
import br.com.tws.msserviceorders.service.ServiceOrderCatalogItemService;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ServiceOrderCatalogItemServiceImpl implements ServiceOrderCatalogItemService {

    private final ServiceOrderCatalogItemRepository serviceOrderCatalogItemRepository;
    private final ServiceOrderCatalogItemMapper serviceOrderCatalogItemMapper;

    @Override
    public Mono<ServiceOrderCatalogItemEntity> create(Long workshopId, ServiceOrderCatalogItemUpsertRequest request) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return serviceOrderCatalogItemRepository.save(
                serviceOrderCatalogItemMapper.toNewEntity(workshopId, request, now)
        );
    }

    @Override
    public Flux<ServiceOrderCatalogItemEntity> list(Long workshopId, String type) {
        return serviceOrderCatalogItemRepository.findAllByWorkshopIdAndTypeOrderByDescriptionAsc(
                workshopId,
                serviceOrderCatalogItemMapper.normalizeType(type)
        );
    }

    @Override
    public Mono<ServiceOrderCatalogItemEntity> getById(Long workshopId, Long id) {
        return serviceOrderCatalogItemRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new ServiceOrderCatalogItemNotFoundException(id)));
    }

    @Override
    public Mono<ServiceOrderCatalogItemEntity> update(
            Long workshopId,
            Long id,
            ServiceOrderCatalogItemUpsertRequest request
    ) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return getById(workshopId, id)
                .map(current -> serviceOrderCatalogItemMapper.merge(current, request, now))
                .flatMap(serviceOrderCatalogItemRepository::save);
    }

    @Override
    public Mono<Void> delete(Long workshopId, Long id) {
        return getById(workshopId, id)
                .flatMap(serviceOrderCatalogItemRepository::delete);
    }
}
