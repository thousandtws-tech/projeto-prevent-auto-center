package br.com.tws.msbackup.service;

import br.com.tws.msbackup.config.BackupProperties;
import br.com.tws.msbackup.domain.entity.BackupSettingsEntity;
import br.com.tws.msbackup.exception.BadRequestException;
import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class BackupScheduleSupport {

    private static final List<DateTimeFormatter> TIME_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("H:mm"),
            DateTimeFormatter.ofPattern("H:mm:ss"),
            DateTimeFormatter.ofPattern("h:mm a", Locale.US),
            DateTimeFormatter.ofPattern("hh:mm a", Locale.US)
    );

    private static final Map<String, DayOfWeek> DAY_ALIASES = Map.ofEntries(
            Map.entry("MONDAY", DayOfWeek.MONDAY),
            Map.entry("MON", DayOfWeek.MONDAY),
            Map.entry("SEG", DayOfWeek.MONDAY),
            Map.entry("SEGUNDA", DayOfWeek.MONDAY),
            Map.entry("1", DayOfWeek.MONDAY),
            Map.entry("TUESDAY", DayOfWeek.TUESDAY),
            Map.entry("TUE", DayOfWeek.TUESDAY),
            Map.entry("TER", DayOfWeek.TUESDAY),
            Map.entry("TERCA", DayOfWeek.TUESDAY),
            Map.entry("2", DayOfWeek.TUESDAY),
            Map.entry("WEDNESDAY", DayOfWeek.WEDNESDAY),
            Map.entry("WED", DayOfWeek.WEDNESDAY),
            Map.entry("QUA", DayOfWeek.WEDNESDAY),
            Map.entry("QUARTA", DayOfWeek.WEDNESDAY),
            Map.entry("3", DayOfWeek.WEDNESDAY),
            Map.entry("THURSDAY", DayOfWeek.THURSDAY),
            Map.entry("THU", DayOfWeek.THURSDAY),
            Map.entry("QUI", DayOfWeek.THURSDAY),
            Map.entry("QUINTA", DayOfWeek.THURSDAY),
            Map.entry("4", DayOfWeek.THURSDAY),
            Map.entry("FRIDAY", DayOfWeek.FRIDAY),
            Map.entry("FRI", DayOfWeek.FRIDAY),
            Map.entry("SEX", DayOfWeek.FRIDAY),
            Map.entry("SEXA", DayOfWeek.FRIDAY),
            Map.entry("5", DayOfWeek.FRIDAY),
            Map.entry("SATURDAY", DayOfWeek.SATURDAY),
            Map.entry("SAT", DayOfWeek.SATURDAY),
            Map.entry("SAB", DayOfWeek.SATURDAY),
            Map.entry("SABADO", DayOfWeek.SATURDAY),
            Map.entry("6", DayOfWeek.SATURDAY),
            Map.entry("SUNDAY", DayOfWeek.SUNDAY),
            Map.entry("SUN", DayOfWeek.SUNDAY),
            Map.entry("DOM", DayOfWeek.SUNDAY),
            Map.entry("DOMINGO", DayOfWeek.SUNDAY),
            Map.entry("0", DayOfWeek.SUNDAY),
            Map.entry("7", DayOfWeek.SUNDAY)
    );

    public BackupScheduleDefinition normalizeDefaults(BackupProperties backupProperties) {
        return normalize(
                backupProperties.getDefaultScheduleDays(),
                backupProperties.getDefaultScheduleTime(),
                backupProperties.getDefaultTimezone()
        );
    }

    public BackupScheduleDefinition normalize(List<String> daysOfWeek, String scheduleTime, String timezone) {
        List<DayOfWeek> normalizedDays = parseDays(daysOfWeek);
        LocalTime normalizedTime = parseTime(scheduleTime);
        ZoneId normalizedZone = parseZone(timezone);

        return new BackupScheduleDefinition(
                normalizedDays,
                normalizedDays.stream().map(DayOfWeek::name).reduce((left, right) -> left + "," + right).orElse(""),
                normalizedTime.format(DateTimeFormatter.ofPattern("HH:mm")),
                normalizedZone.getId()
        );
    }

    public List<String> toResponseDays(String scheduleDays) {
        return parseStoredDays(scheduleDays).stream()
                .map(DayOfWeek::name)
                .toList();
    }

    public OffsetDateTime resolveNextScheduledAt(BackupSettingsEntity settings, Instant referenceInstant) {
        if (!Boolean.TRUE.equals(settings.getAutomaticEnabled())) {
            return null;
        }

        List<DayOfWeek> daysOfWeek = parseStoredDays(settings.getScheduleDays());
        if (daysOfWeek.isEmpty()) {
            return null;
        }

        LocalTime scheduleTime = parseTime(settings.getScheduleTime());
        ZoneId zoneId = parseZone(settings.getTimezone());
        ZonedDateTime reference = ZonedDateTime.ofInstant(referenceInstant, zoneId);

        for (int offset = 0; offset <= 14; offset++) {
            LocalDate candidateDate = reference.toLocalDate().plusDays(offset);
            if (!daysOfWeek.contains(candidateDate.getDayOfWeek())) {
                continue;
            }

            ZonedDateTime candidate = candidateDate.atTime(scheduleTime).atZone(zoneId);
            if (candidate.isAfter(reference)) {
                return candidate.withZoneSameInstant(ZoneOffset.UTC).toOffsetDateTime();
            }
        }

        return null;
    }

    public Optional<OffsetDateTime> resolveLatestScheduledAt(BackupSettingsEntity settings, Instant referenceInstant) {
        if (!Boolean.TRUE.equals(settings.getAutomaticEnabled())) {
            return Optional.empty();
        }

        List<DayOfWeek> daysOfWeek = parseStoredDays(settings.getScheduleDays());
        if (daysOfWeek.isEmpty()) {
            return Optional.empty();
        }

        LocalTime scheduleTime = parseTime(settings.getScheduleTime());
        ZoneId zoneId = parseZone(settings.getTimezone());
        ZonedDateTime reference = ZonedDateTime.ofInstant(referenceInstant, zoneId);

        for (int offset = 0; offset <= 7; offset++) {
            LocalDate candidateDate = reference.toLocalDate().minusDays(offset);
            if (!daysOfWeek.contains(candidateDate.getDayOfWeek())) {
                continue;
            }

            ZonedDateTime candidate = candidateDate.atTime(scheduleTime).atZone(zoneId);
            if (!candidate.isAfter(reference)) {
                return Optional.of(candidate.withZoneSameInstant(ZoneOffset.UTC).toOffsetDateTime());
            }
        }

        return Optional.empty();
    }

    private List<DayOfWeek> parseStoredDays(String scheduleDays) {
        if (!StringUtils.hasText(scheduleDays)) {
            return List.of();
        }

        return parseDays(List.of(scheduleDays.split(",")));
    }

    private List<DayOfWeek> parseDays(List<String> rawDays) {
        if (rawDays == null || rawDays.isEmpty()) {
            throw new BadRequestException("Informe ao menos um dia valido para o agendamento do backup.");
        }

        LinkedHashSet<DayOfWeek> normalizedDays = new LinkedHashSet<>();

        for (String rawDay : rawDays) {
            String normalizedToken = normalizeToken(rawDay);
            DayOfWeek dayOfWeek = DAY_ALIASES.get(normalizedToken);
            if (dayOfWeek == null) {
                throw new BadRequestException("Dia de agendamento invalido: " + rawDay + ".");
            }
            normalizedDays.add(dayOfWeek);
        }

        return List.copyOf(normalizedDays);
    }

    private LocalTime parseTime(String rawTime) {
        if (!StringUtils.hasText(rawTime)) {
            throw new BadRequestException("Informe um horario valido para o backup.");
        }

        String normalized = rawTime.trim().toUpperCase(Locale.US);
        for (DateTimeFormatter formatter : TIME_FORMATTERS) {
            try {
                return LocalTime.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
                // Try the next supported format.
            }
        }

        throw new BadRequestException("Horario de backup invalido: " + rawTime + ".");
    }

    private ZoneId parseZone(String timezone) {
        if (!StringUtils.hasText(timezone)) {
            throw new BadRequestException("Informe um fuso horario valido para o backup.");
        }

        try {
            return ZoneId.of(timezone.trim());
        } catch (Exception exception) {
            throw new BadRequestException("Fuso horario invalido: " + timezone + ".");
        }
    }

    private String normalizeToken(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return "";
        }

        String normalized = Normalizer.normalize(rawToken, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("-", "")
                .replace("_", "")
                .trim()
                .toUpperCase(Locale.US);

        if ("SEGUNDAFEIRA".equals(normalized)) {
            return "SEGUNDA";
        }
        if ("TERCAFEIRA".equals(normalized)) {
            return "TERCA";
        }
        if ("QUARTAFEIRA".equals(normalized)) {
            return "QUARTA";
        }
        if ("QUINTAFEIRA".equals(normalized)) {
            return "QUINTA";
        }
        if ("SEXTAFEIRA".equals(normalized)) {
            return "SEXA";
        }
        if ("SABADO".equals(normalized)) {
            return "SABADO";
        }

        return normalized;
    }
}
