package br.com.tws.msauth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

import br.com.tws.msauth.dto.request.LoginRequest;
import br.com.tws.msauth.dto.request.RefreshTokenRequest;
import br.com.tws.msauth.dto.request.WorkshopSignupRequest;
import br.com.tws.msauth.dto.response.AuthResponse;
import br.com.tws.msauth.dto.response.SignupResponse;
import br.com.tws.msauth.service.EmailVerificationEmailService;
import br.com.tws.msauth.media.MediaStorageService;
import br.com.tws.msauth.media.StoredMediaAsset;
import br.com.tws.msauth.repository.AuthUserRepository;
import br.com.tws.msauth.repository.RefreshTokenRepository;
import br.com.tws.msauth.repository.WorkshopRepository;
import br.com.tws.msauth.support.AbstractPostgresIntegrationTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.web.reactive.function.BodyInserters;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import java.time.OffsetDateTime;
import reactor.core.publisher.Mono;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class AuthControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private AuthUserRepository authUserRepository;

    @Autowired
    private WorkshopRepository workshopRepository;

    @MockitoBean
    private MediaStorageService mediaStorageService;

    @MockitoBean
    private EmailVerificationEmailService emailVerificationEmailService;

    @BeforeEach
    void cleanDatabase() {
        reset(mediaStorageService);
        reset(emailVerificationEmailService);
        when(emailVerificationEmailService.sendSignupVerificationEmail(any(), any(), anyString()))
                .thenReturn(Mono.empty());
        refreshTokenRepository.deleteAll()
                .then(authUserRepository.deleteAll())
                .then(workshopRepository.deleteAll())
                .block();
    }

    @Test
    void shouldSignupWorkshopAndRequireEmailVerification() {
        SignupResponse response = webTestClient.post()
                .uri("/auth/signup")
                .bodyValue(validSignupRequest("oficina-centro", "ana@oficinacentro.com", "Oficina@123"))
                .exchange()
                .expectStatus().isCreated()
                .expectHeader().exists("Location")
                .expectBody(SignupResponse.class)
                .returnResult()
                .getResponseBody();

        assertThat(response).isNotNull();
        assertThat(response.isEmailVerificationRequired()).isTrue();
        assertThat(response.getMessage()).contains("Enviamos um link de confirmacao");
        assertThat(response.getWorkshop().getSlug()).isEqualTo("oficina-centro");
        assertThat(response.getUser().getRole()).isEqualTo("OWNER");
    }

    @Test
    void shouldEnforceWorkshopIsolationOnLogin() {
        webTestClient.post()
                .uri("/auth/signup")
                .bodyValue(validSignupRequest("oficina-centro", "owner@example.com", "SenhaCentro@123"))
                .exchange()
                .expectStatus().isCreated();

        webTestClient.post()
                .uri("/auth/signup")
                .bodyValue(validSignupRequest("oficina-zona-sul", "owner@example.com", "SenhaSul@123"))
                .exchange()
                .expectStatus().isCreated();

        webTestClient.post()
                .uri("/auth/login")
                .bodyValue(LoginRequest.builder()
                        .workshopSlug("oficina-centro")
                        .email("owner@example.com")
                        .password("SenhaSul@123")
                        .build())
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.status").isEqualTo(401)
                .jsonPath("$.message").isEqualTo("Credenciais invalidas.");

        webTestClient.post()
                .uri("/auth/login")
                .bodyValue(LoginRequest.builder()
                        .workshopSlug("oficina-zona-sul")
                        .email("owner@example.com")
                        .password("SenhaSul@123")
                        .build())
                .exchange()
                .expectStatus().isForbidden()
                .expectBody()
                .jsonPath("$.status").isEqualTo(403)
                .jsonPath("$.message").isEqualTo("Confirme o e-mail da conta antes de entrar.");
    }

    @Test
    void shouldRefreshAndReadCurrentSession() {
        AuthResponse signedUp = signupAndReturnAuth("oficina-norte", "norte@example.com");

        AuthResponse refreshed = webTestClient.post()
                .uri("/auth/refresh")
                .bodyValue(RefreshTokenRequest.builder()
                        .refreshToken(signedUp.getRefreshToken())
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody(AuthResponse.class)
                .returnResult()
                .getResponseBody();

        assertThat(refreshed).isNotNull();
        assertThat(refreshed.getAccessToken()).isNotBlank();
        assertThat(refreshed.getRefreshToken()).isNotBlank();
        assertThat(refreshed.getRefreshToken()).isNotEqualTo(signedUp.getRefreshToken());

        webTestClient.get()
                .uri("/auth/me")
                .headers(headers -> headers.setBearerAuth(refreshed.getAccessToken()))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.workshop.slug").isEqualTo("oficina-norte")
                .jsonPath("$.user.email").isEqualTo("norte@example.com");
    }

    @Test
    void shouldUploadWorkshopLogo() {
        when(mediaStorageService.upload(anyString(), any()))
                .thenReturn(reactor.core.publisher.Mono.just(new StoredMediaAsset(
                        "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/branding/logo.png"
                )));

        AuthResponse signedUp = signupAndReturnAuth("oficina-branding", "branding@example.com");

        webTestClient.post()
                .uri("/auth/me/workshop-logo")
                .headers(headers -> headers.setBearerAuth(signedUp.getAccessToken()))
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(imageBody("logo.png")))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.workshop.logoUrl").isEqualTo(
                        "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/branding/logo.png"
                );
    }

    @Test
    void shouldUploadSidebarImage() {
        when(mediaStorageService.upload(anyString(), any()))
                .thenReturn(reactor.core.publisher.Mono.just(new StoredMediaAsset(
                        "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/branding/sidebar.png"
                )));

        AuthResponse signedUp = signupAndReturnAuth("oficina-sidebar", "sidebar@example.com");

        webTestClient.post()
                .uri("/auth/me/sidebar-image")
                .headers(headers -> headers.setBearerAuth(signedUp.getAccessToken()))
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(imageBody("sidebar.png")))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.workshop.sidebarImageUrl").isEqualTo(
                        "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/branding/sidebar.png"
                );
    }

    @Test
    void shouldUploadProfilePhoto() {
        when(mediaStorageService.upload(anyString(), any()))
                .thenReturn(reactor.core.publisher.Mono.just(new StoredMediaAsset(
                        "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/users/1/profile-photo.png"
                )));

        AuthResponse signedUp = signupAndReturnAuth("oficina-avatar", "avatar@example.com");

        webTestClient.post()
                .uri("/auth/me/profile-photo")
                .headers(headers -> headers.setBearerAuth(signedUp.getAccessToken()))
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(imageBody("profile.png")))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.user.profilePhotoUrl").isEqualTo(
                        "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/users/1/profile-photo.png"
                );
    }

    @Test
    void shouldReturnConflictForDuplicatedWorkshopSlug() {
        webTestClient.post()
                .uri("/auth/signup")
                .bodyValue(validSignupRequest("oficina-centro", "owner1@example.com", "SenhaValida@123"))
                .exchange()
                .expectStatus().isCreated();

        webTestClient.post()
                .uri("/auth/signup")
                .bodyValue(validSignupRequest("oficina-centro", "owner2@example.com", "SenhaValida@123"))
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.status").isEqualTo(409)
                .jsonPath("$.message").isEqualTo("Ja existe oficina com slug informado.");
    }

    private WorkshopSignupRequest validSignupRequest(String workshopSlug, String ownerEmail, String ownerPassword) {
        return WorkshopSignupRequest.builder()
                .workshopName("Oficina " + workshopSlug)
                .workshopSlug(workshopSlug)
                .ownerName("Ana Souza")
                .ownerEmail(ownerEmail)
                .ownerPassword(ownerPassword)
                .build();
    }

    private AuthResponse signupAndReturnAuth(String workshopSlug, String email) {
        webTestClient.post()
                .uri("/auth/signup")
                .bodyValue(validSignupRequest(workshopSlug, email, "SenhaValida@123"))
                .exchange()
                .expectStatus().isCreated();

        authUserRepository.findAllByEmail(email)
                .next()
                .flatMap(user -> authUserRepository.save(user.toBuilder()
                        .emailVerifiedAt(OffsetDateTime.now())
                        .updatedAt(OffsetDateTime.now())
                        .build()))
                .block();

        return webTestClient.post()
                .uri("/auth/login")
                .bodyValue(LoginRequest.builder()
                        .workshopSlug(workshopSlug)
                        .email(email)
                        .password("SenhaValida@123")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody(AuthResponse.class)
                .returnResult()
                .getResponseBody();
    }

    private org.springframework.util.MultiValueMap<String, org.springframework.http.HttpEntity<?>> imageBody(String filename) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource("fake-image".getBytes()) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                })
                .contentType(MediaType.IMAGE_PNG);
        return builder.build();
    }
}
