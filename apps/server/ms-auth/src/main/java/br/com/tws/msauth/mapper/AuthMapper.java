package br.com.tws.msauth.mapper;

import br.com.tws.msauth.domain.model.AuthSession;
import br.com.tws.msauth.domain.model.CurrentSession;
import br.com.tws.msauth.domain.model.LoginCommand;
import br.com.tws.msauth.domain.model.SignupResult;
import br.com.tws.msauth.domain.model.WorkshopSignupCommand;
import br.com.tws.msauth.dto.request.LoginRequest;
import br.com.tws.msauth.dto.request.WorkshopSignupRequest;
import br.com.tws.msauth.dto.response.AuthResponse;
import br.com.tws.msauth.dto.response.AuthenticatedUserResponse;
import br.com.tws.msauth.dto.response.SessionResponse;
import br.com.tws.msauth.dto.response.SignupResponse;
import br.com.tws.msauth.dto.response.WorkshopResponse;
import br.com.tws.msauth.validation.util.TextUtils;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AuthMapper {

    public WorkshopSignupCommand toCommand(WorkshopSignupRequest request) {
        return WorkshopSignupCommand.builder()
                .workshopName(TextUtils.normalizeWhitespace(request.getWorkshopName()))
                .workshopSlug(normalizeSlug(request.getWorkshopSlug()))
                .ownerName(TextUtils.normalizeWhitespace(request.getOwnerName()))
                .ownerEmail(normalizeEmail(request.getOwnerEmail()))
                .ownerPassword(request.getOwnerPassword())
                .build();
    }

    public LoginCommand toCommand(LoginRequest request) {
        return LoginCommand.builder()
                .workshopSlug(normalizeSlug(request.getWorkshopSlug()))
                .email(normalizeEmail(request.getEmail()))
                .password(request.getPassword())
                .build();
    }

    public AuthResponse toAuthResponse(AuthSession session) {
        return AuthResponse.builder()
                .accessToken(session.getAccessToken())
                .refreshToken(session.getRefreshToken())
                .tokenType("Bearer")
                .expiresIn(session.getExpiresIn())
                .workshop(toWorkshopResponse(session.getWorkshop()))
                .user(toUserResponse(session.getUser()))
                .build();
    }

    public SignupResponse toSignupResponse(SignupResult result) {
        return SignupResponse.builder()
                .message(result.getMessage())
                .emailVerificationRequired(false)
                .workshop(toWorkshopResponse(result.getWorkshop()))
                .user(toUserResponse(result.getUser()))
                .build();
    }

    public SessionResponse toSessionResponse(CurrentSession session) {
        return SessionResponse.builder()
                .workshop(toWorkshopResponse(session.getWorkshop()))
                .user(toUserResponse(session.getUser()))
                .build();
    }

    private WorkshopResponse toWorkshopResponse(br.com.tws.msauth.domain.entity.WorkshopEntity workshop) {
        return WorkshopResponse.builder()
                .id(workshop.getId())
                .name(workshop.getName())
                .slug(workshop.getSlug())
                .logoUrl(workshop.getLogoUrl())
                .sidebarImageUrl(workshop.getSidebarImageUrl())
                .build();
    }

    private AuthenticatedUserResponse toUserResponse(br.com.tws.msauth.domain.entity.AuthUserEntity user) {
        return AuthenticatedUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .build();
    }

    private String normalizeEmail(String email) {
        return TextUtils.normalizeWhitespace(email).toLowerCase(Locale.ROOT);
    }

    private String normalizeSlug(String slug) {
        String normalized = TextUtils.normalizeWhitespace(slug);
        if (!StringUtils.hasText(normalized)) {
            return null;
        }

        return normalized.toLowerCase(Locale.ROOT);
    }
}
