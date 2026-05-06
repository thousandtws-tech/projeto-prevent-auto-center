package br.com.tws.mscustomers.service.impl;

import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.domain.model.VehicleCommand;
import br.com.tws.mscustomers.domain.model.VehicleSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.PageResult;
import br.com.tws.mscustomers.exception.VehicleNotFoundException;
import br.com.tws.mscustomers.repository.VehicleRepository;
import br.com.tws.mscustomers.repository.VehicleSearchRepository;
import br.com.tws.mscustomers.service.VehicleFactory;
import br.com.tws.mscustomers.service.VehicleService;
import br.com.tws.mscustomers.validation.business.VehicleValidationChain;
import br.com.tws.mscustomers.validation.business.VehicleValidationContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleSearchRepository vehicleSearchRepository;
    private final VehicleFactory vehicleFactory;
    private final VehicleValidationChain vehicleValidationChain;

    @Override
    @Transactional
    public Mono<VehicleEntity> create(Long workshopId, VehicleCommand command) {
        return vehicleValidationChain.validate(new VehicleValidationContext(workshopId, command, null))
                .then(vehicleRepository.save(vehicleFactory.create(workshopId, command)));
    }

    @Override
    public Mono<VehicleEntity> getById(Long workshopId, Long id) {
        return vehicleRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new VehicleNotFoundException(id)));
    }

    @Override
    public Mono<PageResult<VehicleEntity>> list(Long workshopId, VehicleSearchCriteria criteria, PageQuery pageQuery) {
        return Mono.zip(
                        vehicleSearchRepository.search(workshopId, criteria, pageQuery).collectList(),
                        vehicleSearchRepository.count(workshopId, criteria)
                )
                .map(tuple -> PageResult.<VehicleEntity>builder()
                        .content(tuple.getT1())
                        .pageQuery(pageQuery)
                        .totalElements(tuple.getT2())
                        .build());
    }

    @Override
    @Transactional
    public Mono<VehicleEntity> update(Long workshopId, Long id, VehicleCommand command) {
        return vehicleRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new VehicleNotFoundException(id)))
                .flatMap(existing -> vehicleValidationChain.validate(new VehicleValidationContext(workshopId, command, id))
                        .then(vehicleRepository.save(vehicleFactory.update(existing, command))));
    }

    @Override
    @Transactional
    public Mono<Void> delete(Long workshopId, Long id) {
        return vehicleRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new VehicleNotFoundException(id)))
                .flatMap(vehicleRepository::delete);
    }
}
