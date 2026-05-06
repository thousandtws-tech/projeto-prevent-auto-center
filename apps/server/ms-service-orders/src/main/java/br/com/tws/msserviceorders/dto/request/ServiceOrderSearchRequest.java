package br.com.tws.msserviceorders.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class ServiceOrderSearchRequest {

    @Builder.Default
    @Min(value = 0, message = "page deve ser maior ou igual a 0.")
    private Integer page = 0;

    @Builder.Default
    @Min(value = 1, message = "size deve ser maior ou igual a 1.")
    @Max(value = 100, message = "size deve ser menor ou igual a 100.")
    private Integer size = 20;

    @Builder.Default
    private String sort = "createdAt,desc";

    private String status;
    private String orderNumber;
    private String customerName;
    private String signatureStatus;
}
