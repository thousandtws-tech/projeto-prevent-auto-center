package br.com.tws.msbackup.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record BackupSettingsResponse(
        boolean automaticEnabled,
        List<String> daysOfWeek,
        String scheduleTime,
        String timezone,
        OffsetDateTime lastAutomaticExecutionAt,
        OffsetDateTime nextScheduledAt,
        BackupRunResponse lastBackup
) {
}
