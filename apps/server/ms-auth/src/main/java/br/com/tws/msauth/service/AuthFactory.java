package br.com.tws.msauth.service;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import br.com.tws.msauth.domain.entity.EmailVerificationTokenEntity;
import br.com.tws.msauth.domain.entity.RefreshTokenEntity;
import br.com.tws.msauth.domain.entity.WorkshopEntity;
import br.com.tws.msauth.domain.model.UserRole;
import br.com.tws.msauth.domain.model.WorkshopSignupCommand;
import java.time.Clock;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthFactory {

    private final Clock clock;

    public WorkshopEntity newWorkshop(WorkshopSignupCommand command) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        return WorkshopEntity.builder()
                .name(command.getWorkshopName())
                .slug(command.getWorkshopSlug())
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public AuthUserEntity newOwnerUser(Long workshopId, WorkshopSignupCommand command, String passwordHash) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        return AuthUserEntity.builder()
                .workshopId(workshopId)
                .fullName(command.getOwnerName())
                .email(command.getOwnerEmail())
                .passwordHash(passwordHash)
                .role(UserRole.OWNER.name())
                .active(true)
                .emailVerifiedAt(now)
                .verificationEmailSentAt(null)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public EmailVerificationTokenEntity newEmailVerificationToken(Long userId, String tokenHash, OffsetDateTime expiresAt) {
        return EmailVerificationTokenEntity.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .createdAt(OffsetDateTime.now(clock))
                .build();
    }

    public EmailVerificationTokenEntity markEmailVerificationTokenAsUsed(EmailVerificationTokenEntity token) {
        return token.toBuilder()
                .usedAt(OffsetDateTime.now(clock))
                .build();
    }

    public RefreshTokenEntity newRefreshToken(Long userId, String tokenHash, OffsetDateTime expiresAt) {
        return RefreshTokenEntity.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .createdAt(OffsetDateTime.now(clock))
                .build();
    }

    public RefreshTokenEntity revokeRefreshToken(RefreshTokenEntity token) {
        return token.toBuilder()
                .revokedAt(OffsetDateTime.now(clock))
                .build();
    }
}
