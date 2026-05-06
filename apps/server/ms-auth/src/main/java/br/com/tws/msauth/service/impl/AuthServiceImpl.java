package br.com.tws.msauth.service.impl;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import br.com.tws.msauth.domain.entity.EmailVerificationTokenEntity;
import br.com.tws.msauth.domain.entity.RefreshTokenEntity;
import br.com.tws.msauth.domain.entity.WorkshopEntity;
import br.com.tws.msauth.domain.model.AuthSession;
import br.com.tws.msauth.domain.model.CurrentSession;
import br.com.tws.msauth.domain.model.LoginCommand;
import br.com.tws.msauth.domain.model.SignupResult;
import br.com.tws.msauth.domain.model.UserRole;
import br.com.tws.msauth.domain.model.WorkshopSignupCommand;
import br.com.tws.msauth.exception.BadRequestException;
import br.com.tws.msauth.exception.ForbiddenException;
import br.com.tws.msauth.exception.InvalidCredentialsException;
import br.com.tws.msauth.exception.UnauthorizedException;
import br.com.tws.msauth.exception.WorkshopAlreadyExistsException;
import br.com.tws.msauth.media.MediaStorageService;
import br.com.tws.msauth.media.UploadImageCommand;
import br.com.tws.msauth.repository.AuthUserRepository;
import br.com.tws.msauth.repository.EmailVerificationTokenRepository;
import br.com.tws.msauth.repository.RefreshTokenRepository;
import br.com.tws.msauth.repository.WorkshopRepository;
import br.com.tws.msauth.security.AuthenticatedUserContext;
import br.com.tws.msauth.security.JwtProperties;
import br.com.tws.msauth.service.AuthFactory;
import br.com.tws.msauth.service.AuthService;
import br.com.tws.msauth.service.EmailVerificationEmailService;
import br.com.tws.msauth.service.EmailVerificationProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Base64.Encoder REFRESH_TOKEN_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int EMAIL_VERIFICATION_CODE_LENGTH = 6;

    private final WorkshopRepository workshopRepository;
    private final AuthUserRepository authUserRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;
    private final MediaStorageService mediaStorageService;
    private final EmailVerificationEmailService emailVerificationEmailService;
    private final EmailVerificationProperties emailVerificationProperties;
    private final AuthFactory authFactory;
    private final Clock clock;

    public AuthServiceImpl(
            WorkshopRepository workshopRepository,
            AuthUserRepository authUserRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            JwtProperties jwtProperties,
            MediaStorageService mediaStorageService,
            EmailVerificationEmailService emailVerificationEmailService,
            EmailVerificationProperties emailVerificationProperties,
            AuthFactory authFactory,
            Clock clock
    ) {
        this.workshopRepository = workshopRepository;
        this.authUserRepository = authUserRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
        this.mediaStorageService = mediaStorageService;
        this.emailVerificationEmailService = emailVerificationEmailService;
        this.emailVerificationProperties = emailVerificationProperties;
        this.authFactory = authFactory;
        this.clock = clock;
    }

    @Override
    @Transactional
    public Mono<SignupResult> signup(WorkshopSignupCommand command) {
        return resolveSignupCommand(command)
                .flatMap(resolvedCommand -> workshopRepository.existsBySlug(resolvedCommand.getWorkshopSlug())
                .flatMap(exists -> {
                    if (Boolean.TRUE.equals(exists)) {
                        return Mono.error(new WorkshopAlreadyExistsException());
                    }

                    WorkshopEntity workshop = authFactory.newWorkshop(resolvedCommand);
                    return workshopRepository.save(workshop)
                            .flatMap(savedWorkshop -> {
                                AuthUserEntity owner = authFactory.newOwnerUser(
                                        savedWorkshop.getId(),
                                        resolvedCommand,
                                        passwordEncoder.encode(command.getOwnerPassword())
                                );
                                return authUserRepository.save(owner)
                                        .flatMap(savedOwner -> createSignupResult(savedWorkshop, savedOwner));
                            });
                }));
    }

    @Override
    public Mono<AuthSession> login(LoginCommand command) {
        if (!StringUtils.hasText(command.getWorkshopSlug())) {
            return authUserRepository.findAllByEmail(command.getEmail())
                    .filter(this::isActive)
                    .filter(user -> passwordEncoder.matches(command.getPassword(), user.getPasswordHash()))
                    .flatMap(user -> workshopRepository.findById(user.getWorkshopId())
                            .filter(this::isActive)
                            .map(workshop -> new LoginCandidate(workshop, user)))
                    .collectList()
                    .flatMap(matches -> {
                        if (matches.size() != 1) {
                            return Mono.error(new InvalidCredentialsException());
                        }

                        LoginCandidate match = matches.getFirst();
                        ensureEmailVerified(match.user());
                        return createAuthSession(match.workshop(), match.user());
                    });
        }

        return workshopRepository.findBySlug(command.getWorkshopSlug())
                .filter(this::isActive)
                .switchIfEmpty(Mono.error(new InvalidCredentialsException()))
                .flatMap(workshop -> authUserRepository.findByWorkshopIdAndEmail(workshop.getId(), command.getEmail())
                        .filter(this::isActive)
                        .switchIfEmpty(Mono.error(new InvalidCredentialsException()))
                        .flatMap(user -> {
                            if (!passwordEncoder.matches(command.getPassword(), user.getPasswordHash())) {
                                return Mono.error(new InvalidCredentialsException());
                            }
                            ensureEmailVerified(user);
                            return createAuthSession(workshop, user);
                        }));
    }

    @Override
    @Transactional
    public Mono<Void> verifyEmail(String token) {
        if (!StringUtils.hasText(token)) {
            return Mono.error(new BadRequestException("Token de verificacao nao informado."));
        }

        String tokenHash = hashToken(token);
        OffsetDateTime now = OffsetDateTime.now(clock);

        return emailVerificationTokenRepository.findByTokenHashAndUsedAtIsNull(tokenHash)
                .switchIfEmpty(Mono.error(new BadRequestException("Link de verificacao invalido ou expirado.")))
                .flatMap(verificationToken -> {
                    if (verificationToken.getExpiresAt().isBefore(now)) {
                        return Mono.error(new BadRequestException("Link de verificacao expirado. Solicite um novo cadastro."));
                    }

                    return authUserRepository.findById(verificationToken.getUserId())
                            .switchIfEmpty(Mono.error(new BadRequestException("Usuario vinculado ao token nao encontrado.")))
                            .flatMap(user -> {
                                return markUserEmailAsVerified(user, verificationToken, now);
                            });
                });
    }

    @Override
    @Transactional
    public Mono<Void> verifyEmailCode(Long userId, String code) {
        if (userId == null) {
            return Mono.error(new BadRequestException("Usuario de verificacao nao informado."));
        }

        if (!StringUtils.hasText(code)) {
            return Mono.error(new BadRequestException("Codigo de verificacao nao informado."));
        }

        String normalizedCode = code.trim();
        if (!normalizedCode.matches("^[0-9]{6}$")) {
            return Mono.error(new BadRequestException("Codigo de verificacao invalido."));
        }

        String tokenHash = hashToken(normalizedCode);
        OffsetDateTime now = OffsetDateTime.now(clock);

        return emailVerificationTokenRepository.findByUserIdAndTokenHashAndUsedAtIsNull(userId, tokenHash)
                .switchIfEmpty(Mono.error(new BadRequestException("Codigo de verificacao invalido ou expirado.")))
                .flatMap(verificationToken -> {
                    if (verificationToken.getExpiresAt().isBefore(now)) {
                        return Mono.error(new BadRequestException("Codigo de verificacao expirado. Refaca o cadastro para gerar um novo codigo."));
                    }

                    return authUserRepository.findById(verificationToken.getUserId())
                            .switchIfEmpty(Mono.error(new BadRequestException("Usuario vinculado ao codigo nao encontrado.")))
                            .flatMap(user -> markUserEmailAsVerified(user, verificationToken, now));
                });
    }

    @Override
    @Transactional
    public Mono<AuthSession> refresh(String refreshToken) {
        String tokenHash = hashRefreshToken(refreshToken);

        return refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash)
                .switchIfEmpty(Mono.error(new UnauthorizedException("Refresh token invalido.")))
                .flatMap(token -> {
                    OffsetDateTime now = OffsetDateTime.now(clock);
                    if (token.getExpiresAt().isBefore(now)) {
                        return refreshTokenRepository.save(authFactory.revokeRefreshToken(token))
                                .then(Mono.error(new UnauthorizedException("Refresh token expirado.")));
                    }

                    return authUserRepository.findById(token.getUserId())
                            .filter(this::isActive)
                            .switchIfEmpty(Mono.error(new UnauthorizedException("Usuario nao encontrado ou inativo.")))
                            .flatMap(user -> workshopRepository.findById(user.getWorkshopId())
                                    .filter(this::isActive)
                                    .switchIfEmpty(Mono.error(new UnauthorizedException("Oficina nao encontrada ou inativa.")))
                                    .flatMap(workshop -> refreshTokenRepository.save(authFactory.revokeRefreshToken(token))
                                            .then(createAuthSession(workshop, user))));
                });
    }

    @Override
    @Transactional
    public Mono<Void> logout(String refreshToken) {
        String tokenHash = hashRefreshToken(refreshToken);

        return refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash)
                .flatMap(token -> refreshTokenRepository.save(authFactory.revokeRefreshToken(token)).then())
                .then();
    }

    @Override
    public Mono<CurrentSession> currentSession(Long workshopId, Long userId) {
        return workshopRepository.findById(workshopId)
                .filter(this::isActive)
                .switchIfEmpty(Mono.error(new UnauthorizedException("Oficina nao encontrada ou inativa.")))
                .flatMap(workshop -> authUserRepository.findByIdAndWorkshopId(userId, workshopId)
                        .filter(this::isActive)
                        .switchIfEmpty(Mono.error(new UnauthorizedException("Usuario nao encontrado ou inativo.")))
                        .map(user -> CurrentSession.builder()
                                .workshop(workshop)
                                .user(user)
                                .build()));
    }

    @Override
    @Transactional
    public Mono<CurrentSession> uploadWorkshopLogo(AuthenticatedUserContext context, UploadImageCommand command) {
        return Mono.defer(() -> {
            ensureWorkshopBrandingPermission(context);

            return currentSession(context.workshopId(), context.userId())
                    .flatMap(session -> mediaStorageService.upload(workshopLogoPublicId(context.workshopId()), command)
                            .flatMap(asset -> workshopRepository.save(session.getWorkshop().toBuilder()
                                            .logoUrl(asset.secureUrl())
                                            .updatedAt(OffsetDateTime.now(clock))
                                            .build())
                                    .map(savedWorkshop -> CurrentSession.builder()
                                            .workshop(savedWorkshop)
                                            .user(session.getUser())
                                            .build())));
        });
    }

    @Override
    @Transactional
    public Mono<CurrentSession> uploadWorkshopSidebarImage(AuthenticatedUserContext context, UploadImageCommand command) {
        return Mono.defer(() -> {
            ensureWorkshopBrandingPermission(context);

            return currentSession(context.workshopId(), context.userId())
                    .flatMap(session -> mediaStorageService.upload(workshopSidebarImagePublicId(context.workshopId()), command)
                            .flatMap(asset -> workshopRepository.save(session.getWorkshop().toBuilder()
                                            .sidebarImageUrl(asset.secureUrl())
                                            .updatedAt(OffsetDateTime.now(clock))
                                            .build())
                                    .map(savedWorkshop -> CurrentSession.builder()
                                            .workshop(savedWorkshop)
                                            .user(session.getUser())
                                            .build())));
        });
    }

    @Override
    @Transactional
    public Mono<CurrentSession> uploadProfilePhoto(AuthenticatedUserContext context, UploadImageCommand command) {
        return currentSession(context.workshopId(), context.userId())
                .flatMap(session -> mediaStorageService.upload(profilePhotoPublicId(context.workshopId(), context.userId()), command)
                        .flatMap(asset -> authUserRepository.save(session.getUser().toBuilder()
                                        .profilePhotoUrl(asset.secureUrl())
                                        .updatedAt(OffsetDateTime.now(clock))
                                        .build())
                                .map(savedUser -> CurrentSession.builder()
                                        .workshop(session.getWorkshop())
                                        .user(savedUser)
                                        .build())));
    }

    private Mono<AuthSession> createAuthSession(WorkshopEntity workshop, AuthUserEntity user) {
        Instant now = clock.instant();
        String accessToken = generateAccessToken(workshop, user, now);
        String refreshToken = generateRefreshToken();
        String refreshTokenHash = hashRefreshToken(refreshToken);
        OffsetDateTime refreshExpiresAt = OffsetDateTime.ofInstant(now.plus(jwtProperties.refreshTokenTtl()), clock.getZone());
        RefreshTokenEntity refreshTokenEntity = authFactory.newRefreshToken(user.getId(), refreshTokenHash, refreshExpiresAt);

        return refreshTokenRepository.save(refreshTokenEntity)
                .map(ignored -> AuthSession.builder()
                        .workshop(workshop)
                        .user(user)
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .expiresIn(jwtProperties.accessTokenTtl().toSeconds())
                        .build());
    }

    private Mono<SignupResult> createSignupResult(WorkshopEntity workshop, AuthUserEntity user) {
        return Mono.just(SignupResult.builder()
                .workshop(workshop)
                .user(user)
                .message("Cadastro realizado. Agora voce ja pode entrar no sistema.")
                .build());
    }

    private String generateAccessToken(WorkshopEntity workshop, AuthUserEntity user, Instant issuedAt) {
        JwtClaimsSet claimsSet = JwtClaimsSet.builder()
                .issuer("prevent-monolith")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plus(jwtProperties.accessTokenTtl()))
                .subject(user.getId().toString())
                .id(UUID.randomUUID().toString())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole())
                .claim("roles", List.of(user.getRole()))
                .claim("workshopId", workshop.getId())
                .claim("workshopSlug", workshop.getSlug())
                .claim("workshopName", workshop.getName())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claimsSet)).getTokenValue();
    }

    private String generateRefreshToken() {
        return generateOpaqueToken();
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return REFRESH_TOKEN_ENCODER.encodeToString(bytes);
    }

    private String generateVerificationCode() {
        int bound = (int) Math.pow(10, EMAIL_VERIFICATION_CODE_LENGTH);
        int min = bound / 10;
        int value = SECURE_RANDOM.nextInt(min, bound);
        return String.format("%0" + EMAIL_VERIFICATION_CODE_LENGTH + "d", value);
    }

    private String hashRefreshToken(String refreshToken) {
        return hashToken(refreshToken);
    }

    private String hashToken(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Algoritmo SHA-256 nao disponivel.", exception);
        }
    }

    private boolean isActive(WorkshopEntity workshop) {
        return Boolean.TRUE.equals(workshop.getActive());
    }

    private boolean isActive(AuthUserEntity user) {
        return Boolean.TRUE.equals(user.getActive());
    }

    private void ensureEmailVerified(AuthUserEntity user) {
        if (user.getEmailVerifiedAt() == null) {
            throw new ForbiddenException("Confirme o e-mail da conta antes de entrar.");
        }
    }

    private Mono<Void> markUserEmailAsVerified(
            AuthUserEntity user,
            EmailVerificationTokenEntity verificationToken,
            OffsetDateTime now
    ) {
        AuthUserEntity verifiedUser = user.toBuilder()
                .emailVerifiedAt(now)
                .updatedAt(now)
                .build();

        return authUserRepository.save(verifiedUser)
                .then(emailVerificationTokenRepository.save(
                        authFactory.markEmailVerificationTokenAsUsed(verificationToken)
                ))
                .then(emailVerificationTokenRepository.deleteAllByUserId(user.getId()))
                .then();
    }

    private void ensureWorkshopBrandingPermission(AuthenticatedUserContext context) {
        if (context.role() == UserRole.OWNER || context.role() == UserRole.MANAGER) {
            return;
        }

        throw new ForbiddenException("Somente OWNER ou MANAGER podem alterar o branding da oficina.");
    }

    private String workshopLogoPublicId(Long workshopId) {
        return "workshops/" + workshopId + "/branding/logo";
    }

    private String workshopSidebarImagePublicId(Long workshopId) {
        return "workshops/" + workshopId + "/branding/sidebar";
    }

    private String profilePhotoPublicId(Long workshopId, Long userId) {
        return "workshops/" + workshopId + "/users/" + userId + "/profile-photo";
    }

    private Mono<WorkshopSignupCommand> resolveSignupCommand(WorkshopSignupCommand command) {
        String resolvedWorkshopName = buildWorkshopName(command);

        if (StringUtils.hasText(command.getWorkshopSlug())) {
            return Mono.just(WorkshopSignupCommand.builder()
                    .workshopName(resolvedWorkshopName)
                    .workshopSlug(command.getWorkshopSlug())
                    .ownerName(command.getOwnerName())
                    .ownerEmail(command.getOwnerEmail())
                    .ownerPassword(command.getOwnerPassword())
                    .build());
        }

        return resolveAvailableSlug(buildBaseSlug(resolvedWorkshopName))
                .map(resolvedWorkshopSlug -> WorkshopSignupCommand.builder()
                        .workshopName(resolvedWorkshopName)
                        .workshopSlug(resolvedWorkshopSlug)
                        .ownerName(command.getOwnerName())
                        .ownerEmail(command.getOwnerEmail())
                        .ownerPassword(command.getOwnerPassword())
                        .build());
    }

    private Mono<String> resolveAvailableSlug(String baseSlug) {
        return workshopRepository.existsBySlug(baseSlug)
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                        ? resolveAvailableSlug(baseSlug, 2)
                        : Mono.just(baseSlug));
    }

    private Mono<String> resolveAvailableSlug(String baseSlug, int sequence) {
        String suffix = "-" + sequence;
        String candidate = trimSlug(baseSlug, 50 - suffix.length()) + suffix;

        return workshopRepository.existsBySlug(candidate)
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                        ? resolveAvailableSlug(baseSlug, sequence + 1)
                        : Mono.just(candidate));
    }

    private String buildWorkshopName(WorkshopSignupCommand command) {
        if (StringUtils.hasText(command.getWorkshopName())) {
            return trimText(command.getWorkshopName(), 120);
        }

        return trimText("Oficina " + command.getOwnerName(), 120);
    }

    private String buildBaseSlug(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        if (!StringUtils.hasText(normalized)) {
            return "oficina";
        }

        if (normalized.length() < 3) {
            normalized = normalized + "-oficina";
        }

        return trimSlug(normalized, 50);
    }

    private String trimText(String value, int maxLength) {
        String normalized = value.trim();
        if (normalized.length() <= maxLength) {
            return normalized;
        }

        return normalized.substring(0, maxLength).trim();
    }

    private String trimSlug(String value, int maxLength) {
        String normalized = value;
        if (normalized.length() > maxLength) {
            normalized = normalized.substring(0, maxLength);
        }

        normalized = normalized.replaceAll("^-+|-+$", "");

        if (!StringUtils.hasText(normalized)) {
            return "oficina";
        }

        return normalized;
    }

    private record LoginCandidate(WorkshopEntity workshop, AuthUserEntity user) {
    }
}
