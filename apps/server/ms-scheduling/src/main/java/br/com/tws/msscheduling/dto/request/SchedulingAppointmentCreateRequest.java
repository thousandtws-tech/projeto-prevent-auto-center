package br.com.tws.msscheduling.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class SchedulingAppointmentCreateRequest {

    @Schema(description = "Identificador do cliente no ms-customers", example = "1")
    private String customerId;

    @Schema(description = "Nome do cliente", example = "Ana Souza")
    @NotBlank(message = "customerName e obrigatorio.")
    @Size(max = 120, message = "customerName deve ter no maximo 120 caracteres.")
    private String customerName;

    @Schema(description = "Telefone do cliente", example = "(11) 99999-9999")
    @NotBlank(message = "customerPhone e obrigatorio.")
    @Size(max = 40, message = "customerPhone deve ter no maximo 40 caracteres.")
    private String customerPhone;

    @Schema(description = "Email do cliente", example = "ana@oficina.com")
    @Email(message = "customerEmail deve ser um email valido.")
    @Size(max = 160, message = "customerEmail deve ter no maximo 160 caracteres.")
    private String customerEmail;

    @Schema(description = "Modelo do veiculo", example = "Onix Plus")
    @NotBlank(message = "vehicleModel e obrigatorio.")
    @Size(max = 120, message = "vehicleModel deve ter no maximo 120 caracteres.")
    private String vehicleModel;

    @Schema(description = "Placa do veiculo", example = "ABC1D23")
    @Size(max = 20, message = "vehiclePlate deve ter no maximo 20 caracteres.")
    private String vehiclePlate;

    @Schema(description = "Tipo de servico", example = "Troca de oleo e filtros")
    @NotBlank(message = "serviceType e obrigatorio.")
    @Size(max = 120, message = "serviceType deve ter no maximo 120 caracteres.")
    private String serviceType;

    @Schema(description = "Mecanico responsavel previsto", example = "Carlos Silva")
    @Size(max = 120, message = "mechanicResponsible deve ter no maximo 120 caracteres.")
    private String mechanicResponsible;

    @Schema(description = "Observacoes do agendamento", example = "Cliente solicitou confirmacao por WhatsApp")
    @Size(max = 2000, message = "notes deve ter no maximo 2000 caracteres.")
    private String notes;

    @Schema(description = "Data/hora de inicio em ISO-8601", example = "2026-03-10T15:00:00Z")
    @NotNull(message = "startAt e obrigatorio.")
    private OffsetDateTime startAt;

    @Schema(description = "Duracao prevista em minutos", example = "60")
    @NotNull(message = "durationMinutes e obrigatorio.")
    @Min(value = 1, message = "durationMinutes deve ser maior ou igual a 1.")
    @Max(value = 1440, message = "durationMinutes deve ser menor ou igual a 1440.")
    private Integer durationMinutes;

    @Schema(description = "Timezone usada na agenda", example = "America/Sao_Paulo")
    @Size(max = 80, message = "timezone deve ter no maximo 80 caracteres.")
    private String timezone;
}
