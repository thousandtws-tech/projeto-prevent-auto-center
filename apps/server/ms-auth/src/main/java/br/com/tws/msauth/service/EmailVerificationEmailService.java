package br.com.tws.msauth.service;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import br.com.tws.msauth.domain.entity.WorkshopEntity;
import reactor.core.publisher.Mono;

public interface EmailVerificationEmailService {

    Mono<Void> sendSignupVerificationEmail(WorkshopEntity workshop, AuthUserEntity user, String rawToken);
}
