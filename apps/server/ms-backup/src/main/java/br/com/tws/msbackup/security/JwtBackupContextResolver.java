package br.com.tws.msbackup.security;

import br.com.tws.msauth.domain.model.UserRole;
import br.com.tws.msbackup.exception.UnauthorizedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class JwtBackupContextResolver {

    public AuthenticatedBackupContext resolve(Jwt jwt) {
        return new AuthenticatedBackupContext(
                longClaim(jwt, "workshopId"),
                longClaim(jwt, "userId"),
                roleClaim(jwt, "role")
        );
    }

    private Long longClaim(Jwt jwt, String claimName) {
        Object claimValue = jwt.getClaims().get(claimName);

        if (claimValue instanceof Number number) {
            return number.longValue();
        }

        if (claimValue instanceof String text) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException exception) {
                throw new UnauthorizedException("Token de acesso com " + claimName + " invalido.");
            }
        }

        throw new UnauthorizedException("Token de acesso sem " + claimName + ".");
    }

    private UserRole roleClaim(Jwt jwt, String claimName) {
        Object claimValue = jwt.getClaims().get(claimName);

        if (claimValue instanceof String text && !text.isBlank()) {
            try {
                return UserRole.valueOf(text);
            } catch (IllegalArgumentException exception) {
                throw new UnauthorizedException("Token de acesso com " + claimName + " invalido.");
            }
        }

        throw new UnauthorizedException("Token de acesso sem " + claimName + ".");
    }
}
