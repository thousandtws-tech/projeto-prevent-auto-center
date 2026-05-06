package br.com.tws.msauth.repository;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AuthUserRepository extends ReactiveCrudRepository<AuthUserEntity, Long> {

    Mono<Boolean> existsByWorkshopIdAndEmail(Long workshopId, String email);

    Mono<AuthUserEntity> findByWorkshopIdAndEmail(Long workshopId, String email);

    Flux<AuthUserEntity> findAllByWorkshopId(Long workshopId);

    Flux<AuthUserEntity> findAllByEmail(String email);

    Mono<AuthUserEntity> findByIdAndWorkshopId(Long id, Long workshopId);
}
