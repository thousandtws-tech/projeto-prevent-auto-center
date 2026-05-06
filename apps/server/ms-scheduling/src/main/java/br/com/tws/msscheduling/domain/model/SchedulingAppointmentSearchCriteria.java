package br.com.tws.msscheduling.domain.model;

import lombok.Builder;

@Builder
public record SchedulingAppointmentSearchCriteria(
        String status,
        String customerName,
        String serviceType,
        String mechanicResponsible
) {
}
