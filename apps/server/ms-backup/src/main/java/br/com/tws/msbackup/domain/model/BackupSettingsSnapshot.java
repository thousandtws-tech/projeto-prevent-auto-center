package br.com.tws.msbackup.domain.model;

import java.time.OffsetDateTime;
import java.util.List;

public record BackupSettingsSnapshot(
        Boolean automaticEnabled,
        List<String> daysOfWeek,
        String scheduleTime,
        String timezone,
        OffsetDateTime lastAutomaticExecutionAt
) {
}
