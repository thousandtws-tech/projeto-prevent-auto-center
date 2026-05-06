package br.com.tws.msauth.repository;

import br.com.tws.msauth.domain.entity.RefreshTokenEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface RefreshTokenRepository extends ReactiveCrudRepository<RefreshTokenEntity, Long> {

    Mono<RefreshTokenEntity> findByTokenHashAndRevokedAtIsNull(String tokenHash);
}
