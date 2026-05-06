package br.com.tws.msauth.security;

import br.com.tws.msauth.domain.model.UserRole;

public record AuthenticatedUserContext(
        Long workshopId,
        Long userId,
        UserRole role
) {
}
