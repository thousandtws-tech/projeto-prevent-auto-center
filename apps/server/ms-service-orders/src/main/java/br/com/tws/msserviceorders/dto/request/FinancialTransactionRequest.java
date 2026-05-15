package br.com.tws.msserviceorders.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
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
public class FinancialTransactionRequest {

    @NotBlank(message = "type é obrigatorio.")
    @Size(max = 20, message = "type deve ter no maximo 20 caracteres.")
    private String type;

    @Size(max = 20, message = "status deve ter no maximo 20 caracteres.")
    private String status;

    @NotBlank(message = "description é obrigatorio.")
    @Size(max = 180, message = "description deve ter no maximo 180 caracteres.")
    private String description;

    @Size(max = 80, message = "category deve ter no maximo 80 caracteres.")
    private String category;

    @Size(max = 20, message = "expenseClassification deve ter no maximo 20 caracteres.")
    private String expenseClassification;

    @Size(max = 80, message = "paymentMethod deve ter no maximo 80 caracteres.")
    private String paymentMethod;

    @NotNull(message = "amount é obrigatorio.")
    @DecimalMin(value = "0.01", message = "amount deve ser maior que zero.")
    private BigDecimal amount;

    private LocalDate dueDate;

    private OffsetDateTime paidAt;

    private Long supplierId;

    private Long serviceOrderId;

    @Min(value = 1, message = "recurrenceMonths deve ser maior ou igual a 1.")
    @Max(value = 120, message = "recurrenceMonths deve ser menor ou igual a 120.")
    private Integer recurrenceMonths;

    private String notes;
}
