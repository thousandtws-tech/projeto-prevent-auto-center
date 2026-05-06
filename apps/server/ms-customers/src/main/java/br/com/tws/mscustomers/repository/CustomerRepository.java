package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomerRepository extends ReactiveCrudRepository<CustomerEntity, Long> {

    Mono<CustomerEntity> findByIdAndWorkshopId(Long id, Long workshopId);

    Flux<CustomerEntity> findAllByWorkshopId(Long workshopId);

    Mono<Boolean> existsByWorkshopIdAndCpfCnpj(Long workshopId, String cpfCnpj);

    Mono<Boolean> existsByWorkshopIdAndCpfCnpjAndIdNot(Long workshopId, String cpfCnpj, Long id);

    Mono<Boolean> existsByWorkshopIdAndEmail(Long workshopId, String email);

    Mono<Boolean> existsByWorkshopIdAndEmailAndIdNot(Long workshopId, String email, Long id);
}
