package br.com.tws.msauth.controller;

import java.net.URI;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import br.com.tws.msauth.dto.request.LoginRequest;
import br.com.tws.msauth.dto.request.RefreshTokenRequest;
import br.com.tws.msauth.dto.request.VerifyEmailCodeRequest;
import br.com.tws.msauth.dto.request.WorkshopSignupRequest;
import br.com.tws.msauth.dto.response.ApiErrorResponse;
import br.com.tws.msauth.dto.response.AuthResponse;
import br.com.tws.msauth.dto.response.SessionResponse;
import br.com.tws.msauth.dto.response.SignupResponse;
import br.com.tws.msauth.exception.BadRequestException;
import br.com.tws.msauth.service.EmailVerificationProperties;
import br.com.tws.msauth.service.AuthFacade;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Autenticacao multi-tenant para oficinas")
public class AuthController {

    private final AuthFacade authFacade;
    private final EmailVerificationProperties emailVerificationProperties;

    @Operation(
            summary = "Cria uma nova oficina e o usuario proprietario",
            description = "Provisiona uma nova oficina isolada e cria a primeira conta com papel OWNER."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Oficina criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Slug de oficina ja utilizado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/signup")
    public Mono<ResponseEntity<SignupResponse>> signup(@Valid @RequestBody WorkshopSignupRequest request) {
        return authFacade.signup(request)
                .map(response -> ResponseEntity
                        .created(URI.create("/auth/workshops/" + response.getWorkshop().getSlug()))
                        .body(response));
    }

    @Operation(
            summary = "Confirma o e-mail do usuario proprietario",
            description = "Valida o token de confirmacao enviado por e-mail e libera o primeiro login da oficina."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "302", description = "Redireciona para a tela de login com o resultado da confirmacao"),
            @ApiResponse(responseCode = "400", description = "Token nao informado")
    })
    @GetMapping("/verify-email")
    public Mono<ResponseEntity<Void>> verifyEmail(@RequestParam("token") String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Token de verificacao nao informado.");
        }

        return authFacade.verifyEmail(token)
                .thenReturn(buildVerificationRedirect("success", "E-mail confirmado com sucesso. Agora voce ja pode entrar."))
                .onErrorResume(exception -> Mono.just(
                        buildVerificationRedirect("error", exception.getMessage() != null
                                ? exception.getMessage()
                                : "Nao foi possivel confirmar o e-mail.")
                ));
    }

    @Operation(
            summary = "Confirma o e-mail com codigo numerico",
            description = "Valida o codigo digitado no frontend e libera o primeiro login da oficina."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Codigo confirmado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Codigo invalido ou expirado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/verify-email-code")
    public Mono<ResponseEntity<Void>> verifyEmailCode(@Valid @RequestBody VerifyEmailCodeRequest request) {
        return authFacade.verifyEmailCode(request)
                .thenReturn(ResponseEntity.noContent().build());
    }

    @Operation(
            summary = "Autentica um usuario dentro de uma oficina",
            description = "Valida o workshopSlug, email e senha, emitindo access token JWT e refresh token."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Autenticado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Credenciais invalidas",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/login")
    public Mono<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return authFacade.login(request);
    }

    @Operation(
            summary = "Renova a sessao autenticada",
            description = "Rotaciona o refresh token e devolve um novo access token para a mesma oficina."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sessao renovada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Refresh token invalido ou expirado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/refresh")
    public Mono<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authFacade.refresh(request);
    }

    @Operation(
            summary = "Encerra uma sessao",
            description = "Revoga o refresh token informado. A operacao e idempotente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Sessao encerrada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/logout")
    public Mono<ResponseEntity<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        return authFacade.logout(request)
                .thenReturn(ResponseEntity.noContent().build());
    }

    @Operation(
            summary = "Retorna a sessao autenticada atual",
            description = "Le os dados do usuario e da oficina a partir do JWT informado no header Authorization."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sessao atual retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/me")
    public Mono<SessionResponse> me(@AuthenticationPrincipal Jwt jwt) {
        return authFacade.me(jwt);
    }

    @Operation(
            summary = "Atualiza o logo da oficina",
            description = "Envia uma imagem para o Cloudinary e atualiza o logo principal da oficina autenticada."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Logo atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invalido",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissao para alterar a oficina",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "Cloudinary indisponivel",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping(value = "/me/workshop-logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<SessionResponse> uploadWorkshopLogo(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("file") FilePart filePart
    ) {
        return authFacade.uploadWorkshopLogo(jwt, filePart);
    }

    @Operation(
            summary = "Atualiza a imagem da sidebar",
            description = "Envia uma imagem para o Cloudinary e atualiza o branding usado na sidebar da oficina."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Imagem da sidebar atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invalido",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissao para alterar a oficina",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "Cloudinary indisponivel",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping(value = "/me/sidebar-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<SessionResponse> uploadWorkshopSidebarImage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("file") FilePart filePart
    ) {
        return authFacade.uploadWorkshopSidebarImage(jwt, filePart);
    }

    @Operation(
            summary = "Atualiza a foto de perfil",
            description = "Envia uma imagem para o Cloudinary e atualiza a foto de perfil do usuario autenticado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Foto de perfil atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invalido",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503", description = "Cloudinary indisponivel",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping(value = "/me/profile-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<SessionResponse> uploadProfilePhoto(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("file") FilePart filePart
    ) {
        return authFacade.uploadProfilePhoto(jwt, filePart);
    }

    private ResponseEntity<Void> buildVerificationRedirect(String status, String message) {
        URI redirectUri = org.springframework.web.util.UriComponentsBuilder
                .fromUriString(emailVerificationProperties.redirectUrl())
                .queryParam("emailVerification", status)
                .queryParam("message", message)
                .build()
                .toUri();

        return ResponseEntity.status(302).location(redirectUri).build();
    }
}
