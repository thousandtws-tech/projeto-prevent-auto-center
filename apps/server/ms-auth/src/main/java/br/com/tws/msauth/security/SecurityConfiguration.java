package br.com.tws.msauth.security;

import br.com.tws.msauth.dto.response.ApiErrorResponse;
import br.com.tws.msauth.service.EmailVerificationProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authorization.ServerAccessDeniedHandler;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
@EnableConfigurationProperties({ JwtProperties.class, EmailVerificationProperties.class })
public class SecurityConfiguration {

    private final ObjectMapper objectMapper;
    private final JwtProperties jwtProperties;

    @Bean
    SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity http,
            Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter,
            ServerAuthenticationEntryPoint authenticationEntryPoint,
            ServerAccessDeniedHandler accessDeniedHandler
    ) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .logout(ServerHttpSecurity.LogoutSpec::disable)
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                .exceptionHandling(spec -> spec
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()
                        .pathMatchers(HttpMethod.POST, "/auth/signup", "/auth/login", "/auth/refresh", "/auth/logout",
                                "/auth/verify-email-code")
                        .permitAll()
                        .pathMatchers(HttpMethod.GET, "/auth/verify-email")
                        .permitAll()
                        .pathMatchers("/actuator/health/**", "/actuator/info", "/v3/api-docs/**", "/swagger-ui.html",
                                "/swagger-ui/**", "/webjars/**")
                        .permitAll()
                        .anyExchange()
                        .authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    ReactiveJwtDecoder jwtDecoder() {
        return NimbusReactiveJwtDecoder.withSecretKey(secretKey())
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey()));
    }

    @Bean
    Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        return new ReactiveJwtAuthenticationConverterAdapter(jwt -> {
            List<GrantedAuthority> authorities = grantedAuthoritiesConverter.convert(jwt).stream().toList();
            return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
        });
    }

    @Bean
    ServerAuthenticationEntryPoint authenticationEntryPoint() {
        return (exchange, exception) -> writeError(exchange, HttpStatus.UNAUTHORIZED, "Nao autenticado.");
    }

    @Bean
    ServerAccessDeniedHandler accessDeniedHandler() {
        return (exchange, exception) -> writeError(exchange, HttpStatus.FORBIDDEN, "Acesso negado.");
    }

    private SecretKey secretKey() {
        return new SecretKeySpec(jwtProperties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String message) {
        ApiErrorResponse body = ApiErrorResponse.builder()
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .path(exchange.getRequest().getPath().value())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .details(List.of())
                .traceId(exchange.getRequest().getId())
                .build();

        byte[] payload;
        try {
            payload = objectMapper.writeValueAsBytes(body);
        } catch (Exception exception) {
            payload = ("{\"status\":" + status.value() + ",\"message\":\"" + message + "\"}")
                    .getBytes(StandardCharsets.UTF_8);
        }

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(payload);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
