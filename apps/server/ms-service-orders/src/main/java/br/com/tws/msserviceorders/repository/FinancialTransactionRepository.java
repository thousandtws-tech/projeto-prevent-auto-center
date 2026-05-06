package br.com.tws.msserviceorders.repository;

import br.com.tws.msserviceorders.domain.entity.FinancialTransactionEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface FinancialTransactionRepository extends ReactiveCrudRepository<FinancialTransactionEntity, Long> {

    Mono<FinancialTransactionEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Flux<FinancialTransactionEntity> findAllByWorkshopId(Long workshopId);
}
