package br.com.tws.msserviceorders.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class ServiceOrderResponse {

    Long id;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
    String status;
    OrderInfoResponse orderInfo;
    Map<String, Boolean> checklist;
    List<PartResponse> parts;
    List<ServiceItemResponse> laborServices;
    List<ServiceItemResponse> thirdPartyServices;
    BigDecimal discount;
    TotalsResponse totals;
    SignatureResponse signature;

    @Value
    @Builder
    @Jacksonized
    public static class OrderInfoResponse {
        String orderNumber;
        String date;
        String customerName;
        String phone;
        String vehicle;
        String year;
        String plate;
        String km;
        String mechanicResponsible;
        String paymentMethod;
        String notes;
    }

    @Value
    @Builder
    @Jacksonized
    public static class PartResponse {
        String id;
        String catalogItemId;
        String partCondition;
        String description;
        Integer quantity;
        BigDecimal unitPrice;
        String status;
    }

    @Value
    @Builder
    @Jacksonized
    public static class ServiceItemResponse {
        String id;
        String catalogItemId;
        String description;
        BigDecimal amount;
        BigDecimal costPrice;
        BigDecimal profitAmount;
        String status;
    }

    @Value
    @Builder
    @Jacksonized
    public static class TotalsResponse {
        BigDecimal partsSubtotal;
        BigDecimal laborSubtotal;
        BigDecimal thirdPartySubtotal;
        BigDecimal grandTotal;
    }

    @Value
    @Builder
    @Jacksonized
    public static class SignatureResponse {
        String token;
        String link;
        String status;
        String signerName;
        String signedAt;
    }
}
