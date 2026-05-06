package br.com.tws.mscustomers.domain.model;

import lombok.Builder;

@Builder
public record MechanicSearchCriteria(
        String name,
        String phone,
        String status
) {
}

