package br.com.tws.msserviceorders.service.impl;

import br.com.tws.msserviceorders.config.ServiceOrdersProperties;
import br.com.tws.msserviceorders.domain.entity.ServiceOrderEntity;
import br.com.tws.msserviceorders.domain.model.PageQuery;
import br.com.tws.msserviceorders.domain.model.PageResult;
import br.com.tws.msserviceorders.domain.model.ServiceOrderSearchCriteria;
import br.com.tws.msserviceorders.dto.request.ServiceOrderUpsertRequest;
import br.com.tws.msserviceorders.dto.request.SignSharedServiceOrderRequest;
import br.com.tws.msserviceorders.exception.ConflictException;
import br.com.tws.msserviceorders.exception.ServiceOrderNotFoundException;
import br.com.tws.msserviceorders.exception.SharedServiceOrderNotFoundException;
import br.com.tws.msserviceorders.mapper.ServiceOrderMapper;
import br.com.tws.msserviceorders.repository.ServiceOrderRepository;
import br.com.tws.msserviceorders.repository.ServiceOrderSearchRepository;
import br.com.tws.msserviceorders.service.ServiceOrderService;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ServiceOrderServiceImpl implements ServiceOrderService {

    private final ServiceOrderRepository serviceOrderRepository;
    private final ServiceOrderSearchRepository serviceOrderSearchRepository;
    private final ServiceOrderMapper serviceOrderMapper;
    private final ServiceOrdersProperties serviceOrdersProperties;
    private final Clock systemClock;

    @Override
    public Mono<ServiceOrderEntity> create(Long workshopId, ServiceOrderUpsertRequest request) {
        OffsetDateTime now = OffsetDateTime.now(systemClock).withOffsetSameInstant(ZoneOffset.UTC);
        return serviceOrderRepository.save(serviceOrderMapper.toNewEntity(workshopId, request, now));
    }

    @Override
    public Mono<ServiceOrderEntity> getById(Long workshopId, Long id) {
        return serviceOrderRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new ServiceOrderNotFoundException(id)));
    }

    @Override
    public Mono<PageResult<ServiceOrderEntity>> list(Long workshopId, ServiceOrderSearchCriteria criteria, PageQuery pageQuery) {
        return serviceOrderSearchRepository.search(workshopId, criteria, pageQuery)
                .collectList()
                .zipWith(serviceOrderSearchRepository.count(workshopId, criteria))
                .map(tuple -> PageResult.<ServiceOrderEntity>builder()
                        .content(tuple.getT1())
                        .pageQuery(pageQuery)
                        .totalElements(tuple.getT2())
                        .build());
    }

    @Override
    public Mono<ServiceOrderEntity> update(Long workshopId, Long id, ServiceOrderUpsertRequest request) {
        OffsetDateTime now = OffsetDateTime.now(systemClock).withOffsetSameInstant(ZoneOffset.UTC);
        return getById(workshopId, id)
                .map(current -> serviceOrderMapper.merge(current, request, now))
                .flatMap(serviceOrderRepository::save);
    }

    @Override
    public Mono<Void> delete(Long workshopId, Long id) {
        return getById(workshopId, id)
                .flatMap(serviceOrderRepository::delete);
    }

    @Override
    public Mono<ServiceOrderEntity> share(Long workshopId, Long id) {
        OffsetDateTime now = OffsetDateTime.now(systemClock).withOffsetSameInstant(ZoneOffset.UTC);

        return getById(workshopId, id)
                .map(current -> {
                    String token = StringUtils.hasText(current.getSignatureToken())
                            ? current.getSignatureToken()
                            : UUID.randomUUID().toString();
                    String baseUrl = serviceOrdersProperties.publicSignatureBaseUrl();
                    String normalizedBaseUrl = StringUtils.hasText(baseUrl)
                            ? baseUrl.replaceAll("/+$", "")
                            : "http://localhost:5173/assinatura-os";
                    String link = normalizedBaseUrl + "/" + token;
                    return serviceOrderMapper.share(current, token, link, now);
                })
                .flatMap(serviceOrderRepository::save);
    }

    @Override
    public Mono<ServiceOrderEntity> getSharedByToken(String token) {
        return serviceOrderRepository.findBySignatureToken(token)
                .switchIfEmpty(Mono.error(new SharedServiceOrderNotFoundException(token)));
    }

    @Override
    public Mono<ServiceOrderEntity> signByToken(String token, SignSharedServiceOrderRequest request) {
        OffsetDateTime now = OffsetDateTime.now(systemClock).withOffsetSameInstant(ZoneOffset.UTC);

        return getSharedByToken(token)
                .flatMap(current -> {
                    if ("signed".equalsIgnoreCase(current.getSignatureStatus())) {
                        return Mono.error(new ConflictException("Esta ordem compartilhada ja foi assinada."));
                    }

                    return serviceOrderRepository.save(serviceOrderMapper.sign(current, request, now));
                });
    }
}
