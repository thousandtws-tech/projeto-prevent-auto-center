package br.com.tws.msbackup.domain.model;

import java.time.OffsetDateTime;

public record BackupUserSnapshot(
        Long id,
        Long workshopId,
        String fullName,
        String email,
        String role,
        String profilePhotoUrl,
        Boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
