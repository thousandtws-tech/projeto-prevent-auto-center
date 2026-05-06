package br.com.tws.msauth.service;

import br.com.tws.msauth.dto.request.LoginRequest;
import br.com.tws.msauth.dto.request.RefreshTokenRequest;
import br.com.tws.msauth.dto.request.VerifyEmailCodeRequest;
import br.com.tws.msauth.dto.request.WorkshopSignupRequest;
import br.com.tws.msauth.dto.response.AuthResponse;
import br.com.tws.msauth.dto.response.SessionResponse;
import br.com.tws.msauth.dto.response.SignupResponse;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.oauth2.jwt.Jwt;
import reactor.core.publisher.Mono;

public interface AuthFacade {

    Mono<SignupResponse> signup(WorkshopSignupRequest request);

    Mono<AuthResponse> login(LoginRequest request);

    Mono<Void> verifyEmail(String token);

    Mono<Void> verifyEmailCode(VerifyEmailCodeRequest request);

    Mono<AuthResponse> refresh(RefreshTokenRequest request);

    Mono<Void> logout(RefreshTokenRequest request);

    Mono<SessionResponse> me(Jwt jwt);

    Mono<SessionResponse> uploadWorkshopLogo(Jwt jwt, FilePart filePart);

    Mono<SessionResponse> uploadWorkshopSidebarImage(Jwt jwt, FilePart filePart);

    Mono<SessionResponse> uploadProfilePhoto(Jwt jwt, FilePart filePart);
}
