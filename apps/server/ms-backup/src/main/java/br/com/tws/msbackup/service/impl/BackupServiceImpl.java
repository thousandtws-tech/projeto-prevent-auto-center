package br.com.tws.msbackup.service.impl;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import br.com.tws.msauth.domain.entity.WorkshopEntity;
import br.com.tws.msauth.repository.AuthUserRepository;
import br.com.tws.msauth.repository.WorkshopRepository;
import br.com.tws.msbackup.config.BackupProperties;
import br.com.tws.msbackup.domain.entity.BackupRunEntity;
import br.com.tws.msbackup.domain.entity.BackupSettingsEntity;
import br.com.tws.msbackup.domain.model.BackupArchive;
import br.com.tws.msbackup.domain.model.BackupDownloadArtifact;
import br.com.tws.msbackup.domain.model.BackupSettingsSnapshot;
import br.com.tws.msbackup.domain.model.BackupUserSnapshot;
import br.com.tws.msbackup.domain.model.BackupRunStatus;
import br.com.tws.msbackup.domain.model.BackupTriggerType;
import br.com.tws.msbackup.domain.model.StoredBackupArtifact;
import br.com.tws.msbackup.dto.request.BackupSettingsUpdateRequest;
import br.com.tws.msbackup.dto.response.BackupImportResponse;
import br.com.tws.msbackup.dto.response.BackupRunResponse;
import br.com.tws.msbackup.dto.response.BackupSettingsResponse;
import br.com.tws.msbackup.exception.BackupRunNotFoundException;
import br.com.tws.msbackup.exception.BadRequestException;
import br.com.tws.msbackup.repository.BackupRunRepository;
import br.com.tws.msbackup.repository.BackupSettingsRepository;
import br.com.tws.msbackup.security.AuthenticatedBackupContext;
import br.com.tws.msbackup.service.BackupArtifactStorage;
import br.com.tws.msbackup.service.BackupScheduleDefinition;
import br.com.tws.msbackup.service.BackupScheduleSupport;
import br.com.tws.msbackup.service.BackupService;
import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.repository.CustomerRepository;
import br.com.tws.mscustomers.repository.VehicleRepository;
import br.com.tws.msscheduling.domain.entity.SchedulingAppointmentEntity;
import br.com.tws.msscheduling.repository.SchedulingAppointmentRepository;
import br.com.tws.msserviceorders.domain.entity.ServiceOrderCatalogItemEntity;
import br.com.tws.msserviceorders.domain.entity.ServiceOrderEntity;
import br.com.tws.msserviceorders.repository.ServiceOrderCatalogItemRepository;
import br.com.tws.msserviceorders.repository.ServiceOrderRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.zip.ZipArchiveEntry;
import org.apache.commons.compress.archivers.zip.ZipArchiveOutputStream;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackupServiceImpl implements BackupService {

    private static final DateTimeFormatter ARCHIVE_TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    private static final int MAX_HISTORY_LIMIT = 100;
    private static final int MAX_ERROR_MESSAGE_LENGTH = 1500;
    private static final Duration TEMP_FILE_DELETE_TIMEOUT = Duration.ofSeconds(5);

    private final BackupProperties backupProperties;
    private final BackupSettingsRepository backupSettingsRepository;
    private final BackupRunRepository backupRunRepository;
    private final WorkshopRepository workshopRepository;
    private final AuthUserRepository authUserRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final ServiceOrderCatalogItemRepository serviceOrderCatalogItemRepository;
    private final SchedulingAppointmentRepository schedulingAppointmentRepository;
    private final BackupArtifactStorage backupArtifactStorage;
    private final BackupScheduleSupport backupScheduleSupport;
    private final ObjectMapper objectMapper;
    private final DatabaseClient databaseClient;
    private final Clock systemClock;

    @Override
    public Mono<BackupSettingsResponse> getSettings(Long workshopId) {
        return getOrCreateSettings(workshopId)
                .flatMap(settings -> latestSuccessfulRun(workshopId)
                        .map(this::toRunResponse)
                        .map(Optional::of)
                        .defaultIfEmpty(Optional.empty())
                        .map(lastBackup -> toSettingsResponse(settings, lastBackup.orElse(null))));
    }

    @Override
    @Transactional
    public Mono<BackupSettingsResponse> updateSettings(Long workshopId, BackupSettingsUpdateRequest request) {
        BackupScheduleDefinition scheduleDefinition = backupScheduleSupport.normalize(
                request.daysOfWeek(),
                request.scheduleTime(),
                request.timezone()
        );

        return getOrCreateSettings(workshopId)
                .flatMap(existing -> {
                    OffsetDateTime now = nowUtc();
                    BackupSettingsEntity updated = existing.toBuilder()
                            .automaticEnabled(Boolean.TRUE.equals(request.automaticEnabled()))
                            .scheduleDays(scheduleDefinition.scheduleDays())
                            .scheduleTime(scheduleDefinition.scheduleTime())
                            .timezone(scheduleDefinition.timezone())
                            .updatedAt(now)
                            .build();
                    return backupSettingsRepository.save(updated);
                })
                .flatMap(saved -> latestSuccessfulRun(workshopId)
                        .map(this::toRunResponse)
                        .map(Optional::of)
                        .defaultIfEmpty(Optional.empty())
                        .map(lastBackup -> toSettingsResponse(saved, lastBackup.orElse(null))));
    }

    @Override
    public Mono<BackupRunResponse> runManualBackup(AuthenticatedBackupContext context) {
        return getOrCreateSettings(context.workshopId())
                .flatMap(settings -> executeBackup(
                        context.workshopId(),
                        context.userId(),
                        BackupTriggerType.MANUAL,
                        null,
                        settings
                ))
                .map(this::toRunResponse);
    }

    @Override
    public Mono<List<BackupRunResponse>> listHistory(Long workshopId, int limit) {
        int normalizedLimit = Math.max(1, Math.min(limit, MAX_HISTORY_LIMIT));
        return backupRunRepository.findAllByWorkshopIdOrderByStartedAtDesc(workshopId)
                .take(normalizedLimit)
                .map(this::toRunResponse)
                .collectList();
    }

    @Override
    public Mono<BackupDownloadArtifact> download(Long workshopId, Long backupRunId) {
        return backupRunRepository.findByIdAndWorkshopId(backupRunId, workshopId)
                .switchIfEmpty(Mono.error(new BackupRunNotFoundException(backupRunId)))
                .flatMap(this::loadBackupArtifact);
    }

    @Override
    @Transactional
    public Mono<BackupImportResponse> importBackup(AuthenticatedBackupContext context, FilePart filePart) {
        return parseUploadedArchive(filePart)
                .flatMap(archive -> restoreArchive(context.workshopId(), archive));
    }

    private Mono<ParsedBackupArchive> parseUploadedArchive(FilePart filePart) {
        if (filePart == null) {
            return Mono.error(new BadRequestException("Envie um arquivo ZIP valido para importar o backup."));
        }

        return Mono.fromCallable(() -> Files.createTempFile("prevent-backup-import-", ".zip"))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(tempFile -> filePart.transferTo(tempFile)
                        .then(readArchive(tempFile))
                        .flatMap(archive -> deleteTempFile(tempFile).thenReturn(archive))
                        .onErrorResume(exception -> deleteTempFile(tempFile)
                                .timeout(TEMP_FILE_DELETE_TIMEOUT, Mono.empty())
                                .onErrorResume(ignored -> Mono.empty())
                                .then(Mono.error(exception))));
    }

    private Mono<ParsedBackupArchive> readArchive(Path archivePath) {
        return Mono.fromCallable(() -> {
                    try (ZipFile zipFile = new ZipFile(archivePath.toFile(), StandardCharsets.UTF_8)) {
                        readRequiredBytes(zipFile, "manifest.json");

                        WorkshopEntity workshop = readRequiredJson(
                                zipFile,
                                "auth/workshop.json",
                                WorkshopEntity.class
                        );

                        List<BackupUserSnapshot> users = readListJson(
                                zipFile,
                                "auth/users.json",
                                new TypeReference<List<BackupUserSnapshot>>() {
                                }
                        );

                        List<CustomerEntity> customers = readListJson(
                                zipFile,
                                "customers/customers.json",
                                new TypeReference<List<CustomerEntity>>() {
                                }
                        );

                        List<VehicleEntity> vehicles = readListJson(
                                zipFile,
                                "customers/vehicles.json",
                                new TypeReference<List<VehicleEntity>>() {
                                }
                        );

                        List<ServiceOrderEntity> serviceOrders = readListJson(
                                zipFile,
                                "service-orders/orders.json",
                                new TypeReference<List<ServiceOrderEntity>>() {
                                }
                        );

                        List<ServiceOrderCatalogItemEntity> catalogItems = readListJson(
                                zipFile,
                                "service-orders/catalog-items.json",
                                new TypeReference<List<ServiceOrderCatalogItemEntity>>() {
                                }
                        );

                        List<SchedulingAppointmentEntity> appointments = readListJson(
                                zipFile,
                                "scheduling/appointments.json",
                                new TypeReference<List<SchedulingAppointmentEntity>>() {
                                }
                        );

                        BackupSettingsSnapshot backupSettings = readOptionalJson(
                                zipFile,
                                "settings/backup.json",
                                BackupSettingsSnapshot.class
                        );

                        return new ParsedBackupArchive(
                                workshop,
                                users,
                                customers,
                                vehicles,
                                serviceOrders,
                                catalogItems,
                                appointments,
                                backupSettings
                        );
                    } catch (BadRequestException exception) {
                        throw exception;
                    } catch (Exception exception) {
                        throw new BadRequestException("Arquivo de backup invalido ou corrompido.");
                    }
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    private Mono<Void> deleteTempFile(Path tempFile) {
        return Mono.fromRunnable(() -> {
                    try {
                        Files.deleteIfExists(tempFile);
                    } catch (Exception ignored) {
                        // Temporary cleanup is best-effort only.
                    }
                })
                .subscribeOn(Schedulers.boundedElastic())
                .then();
    }

    private Mono<BackupImportResponse> restoreArchive(Long workshopId, ParsedBackupArchive archive) {
        return reconcileUsers(workshopId, archive.users())
                .flatMap(userRestoreSummary -> deleteWorkshopScopedData(workshopId)
                        .then(restoreCustomers(workshopId, archive.customers()))
                        .flatMap(customerIdMap -> restoreVehicles(workshopId, archive.vehicles())
                                .then(restoreCatalogItems(workshopId, archive.catalogItems()))
                                .then(restoreServiceOrders(workshopId, archive.serviceOrders()))
                                .then(restoreAppointments(workshopId, archive.appointments(), customerIdMap))
                                .then(restoreWorkshop(workshopId, archive.workshop()))
                                .then(restoreBackupSettings(workshopId, archive.backupSettings()))
                                .thenReturn(new BackupImportResponse(
                                        nowUtc(),
                                        archive.workshop().getName(),
                                        archive.customers().size(),
                                        archive.vehicles().size(),
                                        archive.serviceOrders().size(),
                                        archive.catalogItems().size(),
                                        archive.appointments().size(),
                                        userRestoreSummary.updatedUsers(),
                                        userRestoreSummary.skippedUsers(),
                                        userRestoreSummary.warnings()
                                ))));
    }

    private Mono<UserRestoreSummary> reconcileUsers(Long workshopId, List<BackupUserSnapshot> users) {
        List<String> warnings = new ArrayList<>();
        int[] updatedCount = {0};
        int[] skippedCount = {0};

        return Flux.fromIterable(users)
                .concatMap(user -> {
                    if (!StringUtils.hasText(user.email())) {
                        skippedCount[0]++;
                        warnings.add("Usuario do backup sem e-mail foi ignorado durante a restauracao.");
                        return Mono.empty();
                    }

                    return authUserRepository.findByWorkshopIdAndEmail(workshopId, user.email())
                            .flatMap(existing -> authUserRepository.save(existing.toBuilder()
                                            .fullName(StringUtils.hasText(user.fullName()) ? user.fullName() : existing.getFullName())
                                            .role(StringUtils.hasText(user.role()) ? user.role() : existing.getRole())
                                            .profilePhotoUrl(user.profilePhotoUrl())
                                            .active(user.active() != null ? user.active() : existing.getActive())
                                            .updatedAt(nowUtc())
                                            .build())
                                    .doOnSuccess(ignored -> updatedCount[0]++))
                            .switchIfEmpty(Mono.defer(() -> {
                                skippedCount[0]++;
                                warnings.add(
                                        "Usuario " + user.email() + " nao existe na oficina atual e foi ignorado na restauracao."
                                );
                                return Mono.<AuthUserEntity>empty();
                            }))
                            .then();
                })
                .then(Mono.just(new UserRestoreSummary(
                        updatedCount[0],
                        skippedCount[0],
                        List.copyOf(warnings)
                )));
    }

    private Mono<Void> deleteWorkshopScopedData(Long workshopId) {
        return deleteFromTable("scheduling_appointments", workshopId)
                .then(deleteFromTable("service_orders", workshopId))
                .then(deleteFromTable("service_order_catalog_items", workshopId))
                .then(deleteFromTable("vehicles", workshopId))
                .then(deleteFromTable("customers", workshopId));
    }

    private Mono<Void> deleteFromTable(String tableName, Long workshopId) {
        return databaseClient.sql("DELETE FROM " + tableName + " WHERE workshop_id = :workshopId")
                .bind("workshopId", workshopId)
                .fetch()
                .rowsUpdated()
                .then();
    }

    private Mono<Map<Long, Long>> restoreCustomers(Long workshopId, List<CustomerEntity> customers) {
        return Flux.fromIterable(customers)
                .concatMap(customer -> {
                    Long sourceId = customer.getId();
                    CustomerEntity imported = customer.toBuilder()
                            .id(null)
                            .workshopId(workshopId)
                            .build();

                    return customerRepository.save(imported)
                            .map(saved -> sourceId == null
                                    ? null
                                    : new AbstractMap.SimpleEntry<>(sourceId, saved.getId()));
                })
                .filter(Objects::nonNull)
                .collectMap(Map.Entry::getKey, Map.Entry::getValue, LinkedHashMap::new);
    }

    private Mono<Void> restoreVehicles(Long workshopId, List<VehicleEntity> vehicles) {
        return Flux.fromIterable(vehicles)
                .concatMap(vehicle -> vehicleRepository.save(vehicle.toBuilder()
                                .id(null)
                                .workshopId(workshopId)
                                .build())
                        .then())
                .then();
    }

    private Mono<Void> restoreCatalogItems(Long workshopId, List<ServiceOrderCatalogItemEntity> catalogItems) {
        return Flux.fromIterable(catalogItems)
                .concatMap(catalogItem -> serviceOrderCatalogItemRepository.save(catalogItem.toBuilder()
                                .id(null)
                                .workshopId(workshopId)
                                .build())
                        .then())
                .then();
    }

    private Mono<Void> restoreServiceOrders(Long workshopId, List<ServiceOrderEntity> serviceOrders) {
        return Flux.fromIterable(serviceOrders)
                .concatMap(serviceOrder -> serviceOrderRepository.save(serviceOrder.toBuilder()
                                .id(null)
                                .workshopId(workshopId)
                                .build())
                        .then())
                .then();
    }

    private Mono<Void> restoreAppointments(
            Long workshopId,
            List<SchedulingAppointmentEntity> appointments,
            Map<Long, Long> customerIdMap
    ) {
        return Flux.fromIterable(appointments)
                .concatMap(appointment -> {
                    Long importedCustomerId = appointment.getCustomerId() == null
                            ? null
                            : customerIdMap.get(appointment.getCustomerId());

                    SchedulingAppointmentEntity imported = appointment.toBuilder()
                            .id(null)
                            .workshopId(workshopId)
                            .customerId(importedCustomerId)
                            .build();

                    return schedulingAppointmentRepository.save(imported).then();
                })
                .then();
    }

    private Mono<WorkshopEntity> restoreWorkshop(Long workshopId, WorkshopEntity sourceWorkshop) {
        return workshopRepository.findById(workshopId)
                .switchIfEmpty(Mono.error(new BadRequestException("Oficina atual nao encontrada para restaurar o backup.")))
                .flatMap(existing -> workshopRepository.save(existing.toBuilder()
                        .name(StringUtils.hasText(sourceWorkshop.getName()) ? sourceWorkshop.getName() : existing.getName())
                        .logoUrl(sourceWorkshop.getLogoUrl())
                        .sidebarImageUrl(sourceWorkshop.getSidebarImageUrl())
                        .active(sourceWorkshop.getActive() != null ? sourceWorkshop.getActive() : existing.getActive())
                        .updatedAt(nowUtc())
                        .build()));
    }

    private Mono<Void> restoreBackupSettings(Long workshopId, BackupSettingsSnapshot backupSettings) {
        if (backupSettings == null) {
            return Mono.empty();
        }

        return getOrCreateSettings(workshopId)
                .flatMap(existing -> {
                    List<String> daysOfWeek = backupSettings.daysOfWeek() != null && !backupSettings.daysOfWeek().isEmpty()
                            ? backupSettings.daysOfWeek()
                            : backupScheduleSupport.toResponseDays(existing.getScheduleDays());

                    String scheduleTime = StringUtils.hasText(backupSettings.scheduleTime())
                            ? backupSettings.scheduleTime()
                            : existing.getScheduleTime();

                    String timezone = StringUtils.hasText(backupSettings.timezone())
                            ? backupSettings.timezone()
                            : existing.getTimezone();

                    BackupScheduleDefinition scheduleDefinition = backupScheduleSupport.normalize(
                            daysOfWeek,
                            scheduleTime,
                            timezone
                    );

                    BackupSettingsEntity restored = existing.toBuilder()
                            .automaticEnabled(
                                    backupSettings.automaticEnabled() != null
                                            ? backupSettings.automaticEnabled()
                                            : existing.getAutomaticEnabled()
                            )
                            .scheduleDays(scheduleDefinition.scheduleDays())
                            .scheduleTime(scheduleDefinition.scheduleTime())
                            .timezone(scheduleDefinition.timezone())
                            .lastAutomaticExecutionAt(backupSettings.lastAutomaticExecutionAt())
                            .updatedAt(nowUtc())
                            .build();

                    return backupSettingsRepository.save(restored).then();
                });
    }

    @Override
    public Mono<Void> processDueAutomaticBackups() {
        Instant now = systemClock.instant();

        return backupSettingsRepository.findAllByAutomaticEnabledTrue()
                .concatMap(settings -> processAutomaticBackupIfDue(settings, now)
                        .onErrorResume(exception -> {
                            log.error(
                                    "Falha ao processar o backup automatico da oficina {}.",
                                    settings.getWorkshopId(),
                                    exception
                            );
                            return Mono.empty();
                        }))
                .then();
    }

    private Mono<BackupSettingsEntity> getOrCreateSettings(Long workshopId) {
        return backupSettingsRepository.findByWorkshopId(workshopId)
                .switchIfEmpty(Mono.defer(() -> {
                    BackupScheduleDefinition defaults = backupScheduleSupport.normalizeDefaults(backupProperties);
                    OffsetDateTime now = nowUtc();
                    return backupSettingsRepository.save(BackupSettingsEntity.builder()
                            .workshopId(workshopId)
                            .automaticEnabled(false)
                            .scheduleDays(defaults.scheduleDays())
                            .scheduleTime(defaults.scheduleTime())
                            .timezone(defaults.timezone())
                            .createdAt(now)
                            .updatedAt(now)
                            .build());
                }));
    }

    private Mono<BackupRunEntity> latestSuccessfulRun(Long workshopId) {
        return backupRunRepository.findFirstByWorkshopIdAndStatusOrderByCompletedAtDesc(
                workshopId,
                BackupRunStatus.SUCCESS.name()
        );
    }

    private BackupSettingsResponse toSettingsResponse(BackupSettingsEntity settings, BackupRunResponse lastBackup) {
        return new BackupSettingsResponse(
                Boolean.TRUE.equals(settings.getAutomaticEnabled()),
                backupScheduleSupport.toResponseDays(settings.getScheduleDays()),
                settings.getScheduleTime(),
                settings.getTimezone(),
                settings.getLastAutomaticExecutionAt(),
                backupScheduleSupport.resolveNextScheduledAt(settings, systemClock.instant()),
                lastBackup
        );
    }

    private BackupRunResponse toRunResponse(BackupRunEntity entity) {
        String downloadUrl = BackupRunStatus.SUCCESS.name().equals(entity.getStatus())
                && StringUtils.hasText(entity.getStoragePath())
                ? "/backups/history/" + entity.getId() + "/download"
                : null;

        return new BackupRunResponse(
                entity.getId(),
                entity.getTriggerType(),
                entity.getStatus(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getScheduledFor(),
                entity.getCreatedByUserId(),
                entity.getFileName(),
                entity.getFileSizeBytes(),
                entity.getErrorMessage(),
                downloadUrl
        );
    }

    private Mono<BackupDownloadArtifact> loadBackupArtifact(BackupRunEntity run) {
        if (!BackupRunStatus.SUCCESS.name().equals(run.getStatus()) || !StringUtils.hasText(run.getStoragePath())) {
            return Mono.error(new BadRequestException("O backup solicitado ainda nao possui arquivo disponivel para download."));
        }

        return backupArtifactStorage.load(run.getStoragePath())
                .map(resource -> new BackupDownloadArtifact(
                        run.getFileName(),
                        run.getFileSizeBytes() == null ? 0L : run.getFileSizeBytes(),
                        resource
                ));
    }

    private Mono<Void> processAutomaticBackupIfDue(BackupSettingsEntity settings, Instant now) {
        return Mono.justOrEmpty(backupScheduleSupport.resolveLatestScheduledAt(settings, now))
                .filter(scheduledFor -> shouldRunAutomatically(settings, scheduledFor))
                .flatMap(scheduledFor -> {
                    OffsetDateTime executionAt = nowUtc();
                    BackupSettingsEntity claimedSettings = settings.toBuilder()
                            .lastAutomaticExecutionAt(executionAt)
                            .updatedAt(executionAt)
                            .build();

                    return backupSettingsRepository.save(claimedSettings)
                            .flatMap(savedSettings -> executeBackup(
                                    savedSettings.getWorkshopId(),
                                    null,
                                    BackupTriggerType.AUTOMATIC,
                                    scheduledFor,
                                    savedSettings
                            ))
                            .then();
                })
                .then();
    }

    private boolean shouldRunAutomatically(BackupSettingsEntity settings, OffsetDateTime scheduledFor) {
        OffsetDateTime lastExecution = settings.getLastAutomaticExecutionAt();
        return lastExecution == null || scheduledFor.isAfter(lastExecution);
    }

    private Mono<BackupRunEntity> executeBackup(
            Long workshopId,
            Long createdByUserId,
            BackupTriggerType triggerType,
            OffsetDateTime scheduledFor,
            BackupSettingsEntity settings
    ) {
        OffsetDateTime startedAt = nowUtc();
        BackupRunEntity running = BackupRunEntity.builder()
                .workshopId(workshopId)
                .triggerType(triggerType.name())
                .status(BackupRunStatus.RUNNING.name())
                .startedAt(startedAt)
                .scheduledFor(scheduledFor)
                .createdByUserId(createdByUserId)
                .build();

        return backupRunRepository.save(running)
                .flatMap(savedRun -> buildArchive(workshopId, savedRun, settings)
                        .flatMap(archive -> backupArtifactStorage.store(workshopId, savedRun.getId(), archive.fileName(), archive.bytes())
                                .flatMap(storedArtifact -> markSuccessful(savedRun, archive, storedArtifact)))
                        .onErrorResume(exception -> markFailed(savedRun, exception)
                                .flatMap(ignored -> Mono.error(exception))));
    }

    private Mono<BackupRunEntity> markSuccessful(
            BackupRunEntity savedRun,
            BackupArchive archive,
            StoredBackupArtifact storedArtifact
    ) {
        BackupRunEntity completedRun = savedRun.toBuilder()
                .status(BackupRunStatus.SUCCESS.name())
                .completedAt(nowUtc())
                .fileName(storedArtifact.fileName())
                .fileSizeBytes(archive.sizeBytes())
                .checksumSha256(archive.checksumSha256())
                .storagePath(storedArtifact.storagePath())
                .errorMessage(null)
                .build();

        return backupRunRepository.save(completedRun);
    }

    private Mono<BackupRunEntity> markFailed(BackupRunEntity savedRun, Throwable exception) {
        BackupRunEntity failedRun = savedRun.toBuilder()
                .status(BackupRunStatus.FAILED.name())
                .completedAt(nowUtc())
                .errorMessage(truncateErrorMessage(exception))
                .build();

        return backupRunRepository.save(failedRun);
    }

    private Mono<BackupArchive> buildArchive(Long workshopId, BackupRunEntity backupRun, BackupSettingsEntity settings) {
        Mono<WorkshopEntity> workshopMono = workshopRepository.findById(workshopId)
                .switchIfEmpty(Mono.error(new BadRequestException("Oficina nao encontrada para gerar o backup.")));

        Mono<List<AuthUserEntity>> usersMono = authUserRepository.findAllByWorkshopId(workshopId).collectList();
        Mono<List<CustomerEntity>> customersMono = customerRepository.findAllByWorkshopId(workshopId).collectList();
        Mono<List<VehicleEntity>> vehiclesMono = vehicleRepository.findAllByWorkshopId(workshopId).collectList();
        Mono<List<ServiceOrderEntity>> serviceOrdersMono = serviceOrderRepository.findAllByWorkshopId(workshopId).collectList();
        Mono<List<ServiceOrderCatalogItemEntity>> catalogItemsMono = serviceOrderCatalogItemRepository.findAllByWorkshopId(workshopId)
                .collectList();
        Mono<List<SchedulingAppointmentEntity>> appointmentsMono = schedulingAppointmentRepository.findAllByWorkshopId(workshopId)
                .collectList();

        return Mono.zip(
                        workshopMono,
                        usersMono,
                        customersMono,
                        vehiclesMono,
                        serviceOrdersMono,
                        catalogItemsMono,
                        appointmentsMono
                )
                .flatMap(tuple -> Mono.fromCallable(() -> createArchive(
                                backupRun,
                                settings,
                                tuple.getT1(),
                                tuple.getT2(),
                                tuple.getT3(),
                                tuple.getT4(),
                                tuple.getT5(),
                                tuple.getT6(),
                                tuple.getT7()
                        ))
                        .subscribeOn(Schedulers.boundedElastic()));
    }

    private BackupArchive createArchive(
            BackupRunEntity backupRun,
            BackupSettingsEntity settings,
            WorkshopEntity workshop,
            List<AuthUserEntity> users,
            List<CustomerEntity> customers,
            List<VehicleEntity> vehicles,
            List<ServiceOrderEntity> serviceOrders,
            List<ServiceOrderCatalogItemEntity> catalogItems,
            List<SchedulingAppointmentEntity> appointments
    ) throws Exception {
        ObjectMapper writerMapper = objectMapper.copy().findAndRegisterModules();
        OffsetDateTime generatedAt = nowUtc();
        String fileName = archiveFileName(workshop, backupRun, generatedAt.toInstant());

        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("application", "prevent-monolith");
        manifest.put("module", "ms-backup");
        manifest.put("formatVersion", 1);
        manifest.put("generatedAt", generatedAt);
        manifest.put("backupRunId", backupRun.getId());
        manifest.put("triggerType", backupRun.getTriggerType());
        manifest.put("workshopId", workshop.getId());
        manifest.put("workshopName", workshop.getName());
        manifest.put("workshopSlug", workshop.getSlug());
        manifest.put("sections", List.of(
                section("auth/workshop.json", 1),
                section("auth/users.json", users.size()),
                section("customers/customers.json", customers.size()),
                section("customers/vehicles.json", vehicles.size()),
                section("service-orders/orders.json", serviceOrders.size()),
                section("service-orders/catalog-items.json", catalogItems.size()),
                section("scheduling/appointments.json", appointments.size()),
                section("settings/backup.json", 1)
        ));

        List<Map<String, Object>> exportedUsers = users.stream()
                .map(this::exportUser)
                .toList();

        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
             ZipArchiveOutputStream zipOutputStream = new ZipArchiveOutputStream(byteArrayOutputStream)) {

            zipOutputStream.setEncoding(StandardCharsets.UTF_8.name());

            writeJsonEntry(zipOutputStream, writerMapper, "manifest.json", manifest);
            writeJsonEntry(zipOutputStream, writerMapper, "auth/workshop.json", workshop);
            writeJsonEntry(zipOutputStream, writerMapper, "auth/users.json", exportedUsers);
            writeJsonEntry(zipOutputStream, writerMapper, "customers/customers.json", customers);
            writeJsonEntry(zipOutputStream, writerMapper, "customers/vehicles.json", vehicles);
            writeJsonEntry(zipOutputStream, writerMapper, "service-orders/orders.json", serviceOrders);
            writeJsonEntry(zipOutputStream, writerMapper, "service-orders/catalog-items.json", catalogItems);
            writeJsonEntry(zipOutputStream, writerMapper, "scheduling/appointments.json", appointments);
            writeJsonEntry(zipOutputStream, writerMapper, "settings/backup.json", exportSettings(settings));
            zipOutputStream.finish();

            byte[] bytes = byteArrayOutputStream.toByteArray();
            return new BackupArchive(fileName, bytes, bytes.length, sha256Hex(bytes));
        }
    }

    private void writeJsonEntry(
            ZipArchiveOutputStream zipOutputStream,
            ObjectMapper writerMapper,
            String entryName,
            Object payload
    ) throws Exception {
        byte[] jsonBytes = writerMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
        ZipArchiveEntry zipEntry = new ZipArchiveEntry(entryName);
        zipEntry.setSize(jsonBytes.length);
        zipOutputStream.putArchiveEntry(zipEntry);
        zipOutputStream.write(jsonBytes);
        zipOutputStream.closeArchiveEntry();
    }

    private Map<String, Object> exportUser(AuthUserEntity user) {
        Map<String, Object> exported = new LinkedHashMap<>();
        exported.put("id", user.getId());
        exported.put("workshopId", user.getWorkshopId());
        exported.put("fullName", user.getFullName());
        exported.put("email", user.getEmail());
        exported.put("role", user.getRole());
        exported.put("profilePhotoUrl", user.getProfilePhotoUrl());
        exported.put("active", user.getActive());
        exported.put("createdAt", user.getCreatedAt());
        exported.put("updatedAt", user.getUpdatedAt());
        return exported;
    }

    private Map<String, Object> exportSettings(BackupSettingsEntity settings) {
        Map<String, Object> exported = new LinkedHashMap<>();
        exported.put("automaticEnabled", settings.getAutomaticEnabled());
        exported.put("daysOfWeek", backupScheduleSupport.toResponseDays(settings.getScheduleDays()));
        exported.put("scheduleTime", settings.getScheduleTime());
        exported.put("timezone", settings.getTimezone());
        exported.put("lastAutomaticExecutionAt", settings.getLastAutomaticExecutionAt());
        return exported;
    }

    private Map<String, Object> section(String fileName, int recordCount) {
        Map<String, Object> section = new LinkedHashMap<>();
        section.put("fileName", fileName);
        section.put("recordCount", recordCount);
        return section;
    }

    private String archiveFileName(WorkshopEntity workshop, BackupRunEntity backupRun, Instant generatedAt) {
        String workshopSlug = StringUtils.hasText(workshop.getSlug())
                ? workshop.getSlug().trim().toLowerCase()
                : "workshop-" + workshop.getId();

        String sanitizedSlug = workshopSlug.replaceAll("[^a-z0-9-]", "-");
        String timestamp = ARCHIVE_TIMESTAMP_FORMATTER.withZone(ZoneOffset.UTC).format(generatedAt);
        return "prevent-backup-" + sanitizedSlug + "-run-" + backupRun.getId() + "-" + timestamp + ".zip";
    }

    private String sha256Hex(byte[] content) throws Exception {
        MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
        byte[] digest = messageDigest.digest(content);

        StringBuilder builder = new StringBuilder(digest.length * 2);
        for (byte value : digest) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.ofInstant(systemClock.instant(), ZoneOffset.UTC);
    }

    private String truncateErrorMessage(Throwable throwable) {
        String message = throwable.getMessage();
        if (!StringUtils.hasText(message)) {
            message = throwable.getClass().getSimpleName();
        }

        if (message.length() <= MAX_ERROR_MESSAGE_LENGTH) {
            return message;
        }

        return message.substring(0, MAX_ERROR_MESSAGE_LENGTH);
    }

    private byte[] readRequiredBytes(ZipFile zipFile, String entryName) throws Exception {
        ZipEntry entry = zipFile.getEntry(entryName);
        if (entry == null) {
            throw new BadRequestException("O arquivo importado nao contem a entrada obrigatoria " + entryName + ".");
        }
        return readEntryBytes(zipFile, entry);
    }

    private <T> T readRequiredJson(ZipFile zipFile, String entryName, Class<T> type) throws Exception {
        return objectMapper.readValue(readRequiredBytes(zipFile, entryName), type);
    }

    private <T> T readOptionalJson(ZipFile zipFile, String entryName, Class<T> type) throws Exception {
        ZipEntry entry = zipFile.getEntry(entryName);
        if (entry == null) {
            return null;
        }
        return objectMapper.readValue(readEntryBytes(zipFile, entry), type);
    }

    private <T> List<T> readListJson(ZipFile zipFile, String entryName, TypeReference<List<T>> typeReference) throws Exception {
        ZipEntry entry = zipFile.getEntry(entryName);
        if (entry == null) {
            return List.of();
        }
        return objectMapper.readValue(readEntryBytes(zipFile, entry), typeReference);
    }

    private byte[] readEntryBytes(ZipFile zipFile, ZipEntry entry) throws Exception {
        try (InputStream inputStream = zipFile.getInputStream(entry)) {
            return inputStream.readAllBytes();
        }
    }

    private record ParsedBackupArchive(
            WorkshopEntity workshop,
            List<BackupUserSnapshot> users,
            List<CustomerEntity> customers,
            List<VehicleEntity> vehicles,
            List<ServiceOrderEntity> serviceOrders,
            List<ServiceOrderCatalogItemEntity> catalogItems,
            List<SchedulingAppointmentEntity> appointments,
            BackupSettingsSnapshot backupSettings
    ) {
    }

    private record UserRestoreSummary(
            int updatedUsers,
            int skippedUsers,
            List<String> warnings
    ) {
    }
}
