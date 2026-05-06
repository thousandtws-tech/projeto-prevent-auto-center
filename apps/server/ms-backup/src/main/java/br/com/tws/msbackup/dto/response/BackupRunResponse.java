package br.com.tws.msbackup.dto.response;

import java.time.OffsetDateTime;

public record BackupRunResponse(
        Long id,
        String triggerType,
        String status,
        OffsetDateTime startedAt,
        OffsetDateTime completedAt,
        OffsetDateTime scheduledFor,
        Long createdByUserId,
        String fileName,
        Long fileSizeBytes,
        String errorMessage,
        String downloadUrl
) {
}
