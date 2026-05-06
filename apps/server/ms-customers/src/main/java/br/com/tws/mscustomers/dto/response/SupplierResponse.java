package br.com.tws.mscustomers.dto.response;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class SupplierResponse {

    Long id;
    String name;
    String document;
    String contactName;
    String phone;
    String email;
    String category;
    String address;
    String notes;
    String status;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
}
