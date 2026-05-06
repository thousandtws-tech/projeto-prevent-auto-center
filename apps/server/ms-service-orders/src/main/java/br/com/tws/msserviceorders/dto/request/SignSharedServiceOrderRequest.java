package br.com.tws.msserviceorders.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
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
public class SignSharedServiceOrderRequest {

    @NotBlank(message = "signerName e obrigatorio.")
    private String signerName;

    @Valid
    private List<ServiceOrderUpsertRequest.PartRequest> parts;

    @Valid
    private List<ServiceOrderUpsertRequest.ServiceItemRequest> laborServices;

    @Valid
    private List<ServiceOrderUpsertRequest.ServiceItemRequest> thirdPartyServices;

    @Valid
    private ServiceOrderUpsertRequest.TotalsRequest totals;
}
