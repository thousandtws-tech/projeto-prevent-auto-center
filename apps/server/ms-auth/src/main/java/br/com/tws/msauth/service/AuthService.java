package br.com.tws.msauth.service;

import br.com.tws.msauth.domain.model.AuthSession;
import br.com.tws.msauth.domain.model.CurrentSession;
import br.com.tws.msauth.domain.model.LoginCommand;
import br.com.tws.msauth.domain.model.SignupResult;
import br.com.tws.msauth.domain.model.WorkshopSignupCommand;
import br.com.tws.msauth.media.UploadImageCommand;
import br.com.tws.msauth.security.AuthenticatedUserContext;
import reactor.core.publisher.Mono;

public interface AuthService {

    Mono<SignupResult> signup(WorkshopSignupCommand command);

    Mono<AuthSession> login(LoginCommand command);

    Mono<Void> verifyEmail(String token);

    Mono<Void> verifyEmailCode(Long userId, String code);

    Mono<AuthSession> refresh(String refreshToken);

    Mono<Void> logout(String refreshToken);

    Mono<CurrentSession> currentSession(Long workshopId, Long userId);

    Mono<CurrentSession> uploadWorkshopLogo(AuthenticatedUserContext context, UploadImageCommand command);

    Mono<CurrentSession> uploadWorkshopSidebarImage(AuthenticatedUserContext context, UploadImageCommand command);

    Mono<CurrentSession> uploadProfilePhoto(AuthenticatedUserContext context, UploadImageCommand command);
}
