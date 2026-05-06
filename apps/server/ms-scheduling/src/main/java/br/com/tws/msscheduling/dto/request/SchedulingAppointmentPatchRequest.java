package br.com.tws.msscheduling.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulingAppointmentPatchRequest {

    @Schema(description = "Novo status do agendamento", example = "confirmed")
    private String status;

    @Schema(description = "Mecanico responsavel do atendimento", example = "Carlos Silva")
    @Size(max = 120, message = "mechanicResponsible deve ter no maximo 120 caracteres.")
    private String mechanicResponsible;

    @Valid
    private CustomerPatchRequest customer;

    @Valid
    private VehiclePatchRequest vehicle;

    @Valid
    private SchedulePatchRequest schedule;

    @Valid
    private IntegrationPatchRequest integration;

    @Valid
    private ServiceOrderPatchRequest serviceOrder;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerPatchRequest {

        private String id;

        @Size(max = 120, message = "customer.name deve ter no maximo 120 caracteres.")
        private String name;

        @Size(max = 40, message = "customer.phone deve ter no maximo 40 caracteres.")
        private String phone;

        @Email(message = "customer.email deve ser um email valido.")
        @Size(max = 160, message = "customer.email deve ter no maximo 160 caracteres.")
        private String email;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehiclePatchRequest {

        @Size(max = 120, message = "vehicle.model deve ter no maximo 120 caracteres.")
        private String model;

        @Size(max = 20, message = "vehicle.plate deve ter no maximo 20 caracteres.")
        private String plate;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchedulePatchRequest {

        @Size(max = 120, message = "schedule.serviceType deve ter no maximo 120 caracteres.")
        private String serviceType;

        @Size(max = 2000, message = "schedule.notes deve ter no maximo 2000 caracteres.")
        private String notes;

        private OffsetDateTime startAt;

        private OffsetDateTime endAt;

        @Min(value = 1, message = "schedule.durationMinutes deve ser maior ou igual a 1.")
        @Max(value = 1440, message = "schedule.durationMinutes deve ser menor ou igual a 1440.")
        private Integer durationMinutes;

        @Size(max = 80, message = "schedule.timezone deve ter no maximo 80 caracteres.")
        private String timezone;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntegrationPatchRequest {

        @Size(max = 80, message = "integration.provider deve ter no maximo 80 caracteres.")
        private String provider;

        private OffsetDateTime lastAttemptAt;

        @Size(max = 4000, message = "integration.lastError deve ter no maximo 4000 caracteres.")
        private String lastError;

        @Size(max = 255, message = "integration.eventId deve ter no maximo 255 caracteres.")
        private String eventId;

        @Size(max = 4000, message = "integration.eventLink deve ter no maximo 4000 caracteres.")
        private String eventLink;

        @Size(max = 4000, message = "integration.responseMessage deve ter no maximo 4000 caracteres.")
        private String responseMessage;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceOrderPatchRequest {

        private String id;

        @Size(max = 40, message = "serviceOrder.orderNumber deve ter no maximo 40 caracteres.")
        private String orderNumber;
    }
}
