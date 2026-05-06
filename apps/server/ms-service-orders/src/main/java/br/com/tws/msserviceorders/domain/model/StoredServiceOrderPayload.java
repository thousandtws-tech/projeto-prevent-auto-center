package br.com.tws.msserviceorders.domain.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class StoredServiceOrderPayload {

    OrderInfo orderInfo;

    @JsonInclude(Include.NON_NULL)
    Map<String, Boolean> checklist;

    List<PartItem> parts;
    List<ServiceItem> laborServices;
    List<ServiceItem> thirdPartyServices;
    BigDecimal discount;
    Totals totals;

    @Value
    @Builder
    @Jacksonized
    public static class OrderInfo {
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
    public static class PartItem {
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
    public static class ServiceItem {
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
    public static class Totals {
        BigDecimal partsSubtotal;
        BigDecimal laborSubtotal;
        BigDecimal thirdPartySubtotal;
        BigDecimal grandTotal;
    }
}
