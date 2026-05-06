package br.com.tws.msbackup.security;

import br.com.tws.msauth.domain.model.UserRole;
import br.com.tws.msbackup.exception.ForbiddenException;
import br.com.tws.msbackup.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class AuthenticatedBackupService {

    private final JwtBackupContextResolver jwtBackupContextResolver;

    public Mono<AuthenticatedBackupContext> getRequiredPrivilegedContext() {
        return ReactiveSecurityContextHolder.getContext()
                .map(securityContext -> securityContext.getAuthentication())
                .filter(Authentication::isAuthenticated)
                .switchIfEmpty(Mono.error(new UnauthorizedException("Nao autenticado.")))
                .map(this::extractJwt)
                .map(jwtBackupContextResolver::resolve)
                .flatMap(this::ensurePrivilegedRole);
    }

    private Mono<AuthenticatedBackupContext> ensurePrivilegedRole(AuthenticatedBackupContext context) {
        if (context.role() == UserRole.OWNER || context.role() == UserRole.MANAGER) {
            return Mono.just(context);
        }

        return Mono.error(new ForbiddenException("Somente OWNER ou MANAGER podem operar os backups da oficina."));
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
