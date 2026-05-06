package br.com.tws.mscustomers.security;

import br.com.tws.mscustomers.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class AuthenticatedWorkshopService {

    private final JwtWorkshopContextResolver jwtWorkshopContextResolver;

    public Mono<Long> getRequiredWorkshopId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(securityContext -> securityContext.getAuthentication())
                .filter(Authentication::isAuthenticated)
                .switchIfEmpty(Mono.error(new UnauthorizedException("Nao autenticado.")))
                .map(this::extractJwt)
                .map(jwtWorkshopContextResolver::resolve)
                .map(AuthenticatedWorkshopContext::workshopId)
                .filter(workshopId -> workshopId > 0)
                .switchIfEmpty(Mono.error(new UnauthorizedException("Token de acesso sem workshopId valido.")));
    }

    private Jwt extractJwt(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return jwtAuthenticationToken.getToken();
        }

        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt;
        }

        throw new UnauthorizedException("Token de acesso invalido.");
    }
}
