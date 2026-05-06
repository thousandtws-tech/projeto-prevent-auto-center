package br.com.tws.msserviceorders.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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
public class ServiceOrderUpsertRequest {

    private String status;

    @Valid
    @NotNull(message = "orderInfo e obrigatorio.")
    private OrderInfoRequest orderInfo;

    @Builder.Default
    private Map<String, Boolean> checklist = Map.of();

    @Valid
    @Builder.Default
    private List<PartRequest> parts = List.of();

    @Valid
    @Builder.Default
    private List<ServiceItemRequest> laborServices = List.of();

    @Valid
    @Builder.Default
    private List<ServiceItemRequest> thirdPartyServices = List.of();

    @NotNull(message = "discount e obrigatorio.")
    @DecimalMin(value = "0.0", inclusive = true, message = "discount deve ser maior ou igual a 0.")
    private BigDecimal discount;

    @Valid
    @NotNull(message = "totals e obrigatorio.")
    private TotalsRequest totals;

    @Valid
    private SignatureRequest signature;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderInfoRequest {
        @NotBlank(message = "orderInfo.orderNumber e obrigatorio.")
        @Size(max = 40, message = "orderInfo.orderNumber deve ter no maximo 40 caracteres.")
        private String orderNumber;

        @NotBlank(message = "orderInfo.date e obrigatorio.")
        private String date;

        @NotBlank(message = "orderInfo.customerName e obrigatorio.")
        @Size(max = 120, message = "orderInfo.customerName deve ter no maximo 120 caracteres.")
        private String customerName;

        private String phone;
        private String vehicle;
        private String year;
        private String plate;
        private String km;
        private String mechanicResponsible;
        private String paymentMethod;
        private String notes;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartRequest {
        @NotBlank(message = "parts.id e obrigatorio.")
        private String id;

        private String catalogItemId;

        private String partCondition;

        @NotBlank(message = "parts.description e obrigatorio.")
        private String description;

        @NotNull(message = "parts.quantity e obrigatorio.")
        @Min(value = 0, message = "parts.quantity deve ser maior ou igual a 0.")
        private Integer quantity;

        @NotNull(message = "parts.unitPrice e obrigatorio.")
        @DecimalMin(value = "0.0", inclusive = true, message = "parts.unitPrice deve ser maior ou igual a 0.")
        private BigDecimal unitPrice;

        private String status;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceItemRequest {
        @NotBlank(message = "service.id e obrigatorio.")
        private String id;

        private String catalogItemId;

        @NotBlank(message = "service.description e obrigatorio.")
        private String description;

        @NotNull(message = "service.amount e obrigatorio.")
        @DecimalMin(value = "0.0", inclusive = true, message = "service.amount deve ser maior ou igual a 0.")
        private BigDecimal amount;

        @DecimalMin(value = "0.0", inclusive = true, message = "service.costPrice deve ser maior ou igual a 0.")
        private BigDecimal costPrice;

        @DecimalMin(value = "0.0", inclusive = true, message = "service.profitAmount deve ser maior ou igual a 0.")
        private BigDecimal profitAmount;

        private String status;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TotalsRequest {
        @NotNull(message = "totals.partsSubtotal e obrigatorio.")
        @DecimalMin(value = "0.0", inclusive = true, message = "totals.partsSubtotal deve ser maior ou igual a 0.")
        private BigDecimal partsSubtotal;

        @NotNull(message = "totals.laborSubtotal e obrigatorio.")
        @DecimalMin(value = "0.0", inclusive = true, message = "totals.laborSubtotal deve ser maior ou igual a 0.")
        private BigDecimal laborSubtotal;

        @NotNull(message = "totals.thirdPartySubtotal e obrigatorio.")
        @DecimalMin(value = "0.0", inclusive = true, message = "totals.thirdPartySubtotal deve ser maior ou igual a 0.")
        private BigDecimal thirdPartySubtotal;

        @NotNull(message = "totals.grandTotal e obrigatorio.")
        @DecimalMin(value = "0.0", inclusive = true, message = "totals.grandTotal deve ser maior ou igual a 0.")
        private BigDecimal grandTotal;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignatureRequest {
        private String token;
        private String link;
        private String status;
        private String signerName;
        private String signedAt;
    }
}
