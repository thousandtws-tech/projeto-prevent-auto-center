package br.com.tws.msauth.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import br.com.tws.msauth.domain.entity.WorkshopEntity;
import br.com.tws.msauth.domain.model.UserRole;
import br.com.tws.msauth.exception.ForbiddenException;
import br.com.tws.msauth.media.MediaStorageService;
import br.com.tws.msauth.media.StoredMediaAsset;
import br.com.tws.msauth.media.UploadImageCommand;
import br.com.tws.msauth.repository.AuthUserRepository;
import br.com.tws.msauth.repository.RefreshTokenRepository;
import br.com.tws.msauth.repository.WorkshopRepository;
import br.com.tws.msauth.security.AuthenticatedUserContext;
import br.com.tws.msauth.security.JwtProperties;
import br.com.tws.msauth.service.AuthFactory;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private WorkshopRepository workshopRepository;

    @Mock
    private AuthUserRepository authUserRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtEncoder jwtEncoder;

    @Mock
    private MediaStorageService mediaStorageService;

    @Mock
    private AuthFactory authFactory;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-03-08T18:00:00Z"), ZoneOffset.UTC);
        authService = new AuthServiceImpl(
                workshopRepository,
                authUserRepository,
                refreshTokenRepository,
                passwordEncoder,
                jwtEncoder,
                new JwtProperties("test-secret-key-1234567890", Duration.ofMinutes(15), Duration.ofDays(30)),
                mediaStorageService,
                authFactory,
                fixedClock
        );
    }

    @Test
    void shouldUploadWorkshopLogoForOwner() {
        WorkshopEntity workshop = activeWorkshop();
        AuthUserEntity user = activeOwner();
        UploadImageCommand command = new UploadImageCommand("logo".getBytes(), "logo.png", "image/png");

        when(workshopRepository.findById(1L)).thenReturn(Mono.just(workshop));
        when(authUserRepository.findByIdAndWorkshopId(1L, 1L)).thenReturn(Mono.just(user));
        when(mediaStorageService.upload(eq("workshops/1/branding/logo"), eq(command)))
                .thenReturn(Mono.just(new StoredMediaAsset("https://cdn.example.com/workshops/1/logo.png")));
        when(workshopRepository.save(any(WorkshopEntity.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        StepVerifier.create(authService.uploadWorkshopLogo(
                        new AuthenticatedUserContext(1L, 1L, UserRole.OWNER),
                        command
                ))
                .assertNext(session -> {
                    assertThat(session.getWorkshop().getLogoUrl()).isEqualTo("https://cdn.example.com/workshops/1/logo.png");
                    assertThat(session.getUser().getId()).isEqualTo(1L);
                })
                .verifyComplete();

        ArgumentCaptor<WorkshopEntity> workshopCaptor = ArgumentCaptor.forClass(WorkshopEntity.class);
        verify(workshopRepository).save(workshopCaptor.capture());
        assertThat(workshopCaptor.getValue().getUpdatedAt())
                .isEqualTo(OffsetDateTime.parse("2026-03-08T18:00:00Z"));
    }

    @Test
    void shouldRejectWorkshopBrandingUploadForEmployee() {
        UploadImageCommand command = new UploadImageCommand("logo".getBytes(), "logo.png", "image/png");

        StepVerifier.create(authService.uploadWorkshopLogo(
                        new AuthenticatedUserContext(1L, 99L, UserRole.EMPLOYEE),
                        command
                ))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(ForbiddenException.class);
                    assertThat(error).hasMessage("Somente OWNER ou MANAGER podem alterar o branding da oficina.");
                })
                .verify();

        verifyNoInteractions(workshopRepository, authUserRepository, mediaStorageService);
    }

    @Test
    void shouldUploadProfilePhotoForAuthenticatedUser() {
        WorkshopEntity workshop = activeWorkshop();
        AuthUserEntity user = activeOwner();
        UploadImageCommand command = new UploadImageCommand("avatar".getBytes(), "avatar.png", "image/png");

        when(workshopRepository.findById(1L)).thenReturn(Mono.just(workshop));
        when(authUserRepository.findByIdAndWorkshopId(1L, 1L)).thenReturn(Mono.just(user));
        when(mediaStorageService.upload(eq("workshops/1/users/1/profile-photo"), eq(command)))
                .thenReturn(Mono.just(new StoredMediaAsset("https://cdn.example.com/users/1/profile.png")));
        when(authUserRepository.save(any(AuthUserEntity.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        StepVerifier.create(authService.uploadProfilePhoto(
                        new AuthenticatedUserContext(1L, 1L, UserRole.OWNER),
                        command
                ))
                .assertNext(session -> {
                    assertThat(session.getUser().getProfilePhotoUrl()).isEqualTo("https://cdn.example.com/users/1/profile.png");
                    assertThat(session.getWorkshop().getId()).isEqualTo(1L);
                })
                .verifyComplete();

        ArgumentCaptor<AuthUserEntity> userCaptor = ArgumentCaptor.forClass(AuthUserEntity.class);
        verify(authUserRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getUpdatedAt())
                .isEqualTo(OffsetDateTime.parse("2026-03-08T18:00:00Z"));
    }

    private WorkshopEntity activeWorkshop() {
        return WorkshopEntity.builder()
                .id(1L)
                .name("Oficina Centro")
                .slug("oficina-centro")
                .active(true)
                .createdAt(OffsetDateTime.parse("2026-03-08T17:00:00Z"))
                .updatedAt(OffsetDateTime.parse("2026-03-08T17:00:00Z"))
                .build();
    }

    private AuthUserEntity activeOwner() {
        return AuthUserEntity.builder()
                .id(1L)
                .workshopId(1L)
                .fullName("Ana Souza")
                .email("ana@oficina.com")
                .passwordHash("encoded")
                .role(UserRole.OWNER.name())
                .active(true)
                .createdAt(OffsetDateTime.parse("2026-03-08T17:00:00Z"))
                .updatedAt(OffsetDateTime.parse("2026-03-08T17:00:00Z"))
                .build();
    }
}
