package br.com.tws.msauth.service.impl;

import br.com.tws.msauth.dto.request.LoginRequest;
import br.com.tws.msauth.dto.request.RefreshTokenRequest;
import br.com.tws.msauth.dto.request.VerifyEmailCodeRequest;
import br.com.tws.msauth.dto.request.WorkshopSignupRequest;
import br.com.tws.msauth.dto.response.AuthResponse;
import br.com.tws.msauth.dto.response.SessionResponse;
import br.com.tws.msauth.dto.response.SignupResponse;
import br.com.tws.msauth.mapper.AuthMapper;
import br.com.tws.msauth.media.MediaUploadSupport;
import br.com.tws.msauth.security.AuthenticatedUserContext;
import br.com.tws.msauth.security.JwtSessionContextResolver;
import br.com.tws.msauth.service.AuthFacade;
import br.com.tws.msauth.service.AuthService;
import org.springframework.http.codec.multipart.FilePart;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AuthFacadeImpl implements AuthFacade {

    private final AuthService authService;
    private final AuthMapper authMapper;
    private final JwtSessionContextResolver jwtSessionContextResolver;
    private final MediaUploadSupport mediaUploadSupport;

    @Override
    public Mono<SignupResponse> signup(WorkshopSignupRequest request) {
        return authService.signup(authMapper.toCommand(request))
                .map(authMapper::toSignupResponse);
    }

    @Override
    public Mono<AuthResponse> login(LoginRequest request) {
        return authService.login(authMapper.toCommand(request))
                .map(authMapper::toAuthResponse);
    }

    @Override
    public Mono<Void> verifyEmail(String token) {
        return authService.verifyEmail(token);
    }

    @Override
    public Mono<Void> verifyEmailCode(VerifyEmailCodeRequest request) {
        return authService.verifyEmailCode(request.getUserId(), request.getCode());
    }

    @Override
    public Mono<AuthResponse> refresh(RefreshTokenRequest request) {
        return authService.refresh(request.getRefreshToken())
                .map(authMapper::toAuthResponse);
    }

    @Override
    public Mono<Void> logout(RefreshTokenRequest request) {
        return authService.logout(request.getRefreshToken());
    }

    @Override
    public Mono<SessionResponse> me(Jwt jwt) {
        AuthenticatedUserContext context = jwtSessionContextResolver.resolve(jwt);

        return authService.currentSession(context.workshopId(), context.userId())
                .map(authMapper::toSessionResponse);
    }

    @Override
    public Mono<SessionResponse> uploadWorkshopLogo(Jwt jwt, FilePart filePart) {
        AuthenticatedUserContext context = jwtSessionContextResolver.resolve(jwt);

        return mediaUploadSupport.toCommand(filePart)
                .flatMap(command -> authService.uploadWorkshopLogo(context, command))
                .map(authMapper::toSessionResponse);
    }

    @Override
    public Mono<SessionResponse> uploadWorkshopSidebarImage(Jwt jwt, FilePart filePart) {
        AuthenticatedUserContext context = jwtSessionContextResolver.resolve(jwt);

        return mediaUploadSupport.toCommand(filePart)
                .flatMap(command -> authService.uploadWorkshopSidebarImage(context, command))
                .map(authMapper::toSessionResponse);
    }

    @Override
    public Mono<SessionResponse> uploadProfilePhoto(Jwt jwt, FilePart filePart) {
        AuthenticatedUserContext context = jwtSessionContextResolver.resolve(jwt);

        return mediaUploadSupport.toCommand(filePart)
                .flatMap(command -> authService.uploadProfilePhoto(context, command))
                .map(authMapper::toSessionResponse);
    }
}
