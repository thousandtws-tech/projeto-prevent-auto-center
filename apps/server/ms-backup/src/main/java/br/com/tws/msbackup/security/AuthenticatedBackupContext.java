package br.com.tws.msbackup.security;

import br.com.tws.msauth.domain.model.UserRole;

public record AuthenticatedBackupContext(
        Long workshopId,
        Long userId,
        UserRole role
) {
}
