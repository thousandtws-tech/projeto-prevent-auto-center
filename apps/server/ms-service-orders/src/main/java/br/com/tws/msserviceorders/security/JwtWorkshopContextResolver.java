package br.com.tws.msserviceorders.security;

import br.com.tws.msserviceorders.exception.UnauthorizedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class JwtWorkshopContextResolver {

    public AuthenticatedWorkshopContext resolve(Jwt jwt) {
        return new AuthenticatedWorkshopContext(longClaim(jwt, "workshopId"));
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
}
