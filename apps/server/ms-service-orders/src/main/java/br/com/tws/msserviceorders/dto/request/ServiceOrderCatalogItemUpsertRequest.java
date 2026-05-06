package br.com.tws.msserviceorders.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
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
public class ServiceOrderCatalogItemUpsertRequest {

    @NotBlank(message = "type e obrigatorio.")
    private String type;

    @Size(max = 60, message = "code deve ter no maximo 60 caracteres.")
    private String code;

    @NotBlank(message = "description e obrigatorio.")
    @Size(max = 160, message = "description deve ter no maximo 160 caracteres.")
    private String description;

    @NotNull(message = "defaultPrice e obrigatorio.")
    @DecimalMin(value = "0.0", inclusive = true, message = "defaultPrice deve ser maior ou igual a 0.")
    private BigDecimal defaultPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "costPrice deve ser maior ou igual a 0.")
    private BigDecimal costPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "profitMarginPercent deve ser maior ou igual a 0.")
    private BigDecimal profitMarginPercent;

    @Min(value = 0, message = "stockQuantity deve ser maior ou igual a 0.")
    private Integer stockQuantity;

    @Min(value = 1, message = "estimatedDurationMinutes deve ser maior ou igual a 1.")
    @Max(value = 1440, message = "estimatedDurationMinutes deve ser menor ou igual a 1440.")
    private Integer estimatedDurationMinutes;

    private String partCondition;

    private String status;
}
