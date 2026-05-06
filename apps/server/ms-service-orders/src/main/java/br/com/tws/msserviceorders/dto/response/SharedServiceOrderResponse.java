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
public class SharedServiceOrderResponse {

    String token;
    OffsetDateTime createdAt;
    String status;
    ServiceOrderResponse.OrderInfoResponse orderInfo;
    Map<String, Boolean> checklist;
    List<ServiceOrderResponse.PartResponse> parts;
    List<ServiceOrderResponse.ServiceItemResponse> laborServices;
    List<ServiceOrderResponse.ServiceItemResponse> thirdPartyServices;
    BigDecimal discount;
    ServiceOrderResponse.TotalsResponse totals;
    SignatureResponse signature;

    @Value
    @Builder
    @Jacksonized
    public static class SignatureResponse {
        String name;
        String signedAt;
    }
}
