package br.com.tws.msserviceorders.dto.response;

import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class ShareServiceOrderResponse {

    Long serviceOrderId;
    String token;
    String link;
    String status;
}
