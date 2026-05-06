package br.com.tws.mscustomers.dto.response;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class MechanicResponse {

    Long id;
    String status;
    String name;
    String phone;
    String email;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
}

