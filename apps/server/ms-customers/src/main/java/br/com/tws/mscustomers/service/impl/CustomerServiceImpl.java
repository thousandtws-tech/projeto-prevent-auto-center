package br.com.tws.mscustomers.service.impl;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.model.CustomerCommand;
import br.com.tws.mscustomers.domain.model.CustomerSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.PageResult;
import br.com.tws.mscustomers.exception.CustomerNotFoundException;
import br.com.tws.mscustomers.repository.CustomerRepository;
import br.com.tws.mscustomers.repository.CustomerSearchRepository;
import br.com.tws.mscustomers.service.CustomerFactory;
import br.com.tws.mscustomers.service.CustomerService;
import br.com.tws.mscustomers.validation.business.CustomerValidationChain;
import br.com.tws.mscustomers.validation.business.CustomerValidationContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerSearchRepository customerSearchRepository;
    private final CustomerFactory customerFactory;
    private final CustomerValidationChain customerValidationChain;

    @Override
    @Transactional
    public Mono<CustomerEntity> create(Long workshopId, CustomerCommand command) {
        return customerValidationChain.validate(new CustomerValidationContext(workshopId, command, null))
                .then(customerRepository.save(customerFactory.create(workshopId, command)));
    }

    @Override
    public Mono<CustomerEntity> getById(Long workshopId, Long id) {
        return customerRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(id)));
    }

    @Override
    public Mono<PageResult<CustomerEntity>> list(Long workshopId, CustomerSearchCriteria criteria, PageQuery pageQuery) {
        return Mono.zip(
                        customerSearchRepository.search(workshopId, criteria, pageQuery).collectList(),
                        customerSearchRepository.count(workshopId, criteria)
                )
                .map(tuple -> PageResult.<CustomerEntity>builder()
                        .content(tuple.getT1())
                        .pageQuery(pageQuery)
                        .totalElements(tuple.getT2())
                        .build());
    }

    @Override
    @Transactional
    public Mono<CustomerEntity> update(Long workshopId, Long id, CustomerCommand command) {
        return customerRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(id)))
                .flatMap(existing -> customerValidationChain.validate(new CustomerValidationContext(workshopId, command, id))
                        .then(customerRepository.save(customerFactory.update(existing, command))));
    }

    @Override
    @Transactional
    public Mono<Void> delete(Long workshopId, Long id) {
        return customerRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(id)))
                .flatMap(customerRepository::delete);
    }
}
