package br.com.tws.msauth.repository;

import br.com.tws.msauth.domain.entity.EmailVerificationTokenEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface EmailVerificationTokenRepository extends ReactiveCrudRepository<EmailVerificationTokenEntity, Long> {

    Mono<EmailVerificationTokenEntity> findByTokenHashAndUsedAtIsNull(String tokenHash);

    Mono<EmailVerificationTokenEntity> findByUserIdAndTokenHashAndUsedAtIsNull(Long userId, String tokenHash);

    Mono<Void> deleteAllByUserId(Long userId);
}
