package br.com.tws.msscheduling.dto.response;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class SchedulingAppointmentResponse {

    String id;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
    String status;
    String mechanicResponsible;
    CustomerResponse customer;
    VehicleResponse vehicle;
    ScheduleResponse schedule;
    IntegrationResponse integration;
    ServiceOrderResponse serviceOrder;

    @Value
    @Builder
    @Jacksonized
    public static class CustomerResponse {
        String id;
        String name;
        String phone;
        String email;
    }

    @Value
    @Builder
    @Jacksonized
    public static class VehicleResponse {
        String model;
        String plate;
    }

    @Value
    @Builder
    @Jacksonized
    public static class ScheduleResponse {
        String serviceType;
        String notes;
        OffsetDateTime startAt;
        OffsetDateTime endAt;
        Integer durationMinutes;
        String timezone;
    }

    @Value
    @Builder
    @Jacksonized
    public static class IntegrationResponse {
        String provider;
        OffsetDateTime lastAttemptAt;
        String lastError;
        String eventId;
        String eventLink;
        String responseMessage;
    }

    @Value
    @Builder
    @Jacksonized
    public static class ServiceOrderResponse {
        String id;
        String orderNumber;
    }
}
