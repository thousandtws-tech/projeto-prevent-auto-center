package br.com.tws.msserviceorders.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class ServiceOrderCatalogItemResponse {

    Long id;
    String type;
    String code;
    String description;
    BigDecimal defaultPrice;
    BigDecimal costPrice;
    BigDecimal profitMarginPercent;
    Integer stockQuantity;
    Integer estimatedDurationMinutes;
    String partCondition;
    String status;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
}
