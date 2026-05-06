package br.com.tws.msserviceorders.domain.model;

import lombok.Builder;

@Builder
public record ServiceOrderSearchCriteria(
        String status,
        String orderNumber,
        String customerName,
        String signatureStatus
) {
}
