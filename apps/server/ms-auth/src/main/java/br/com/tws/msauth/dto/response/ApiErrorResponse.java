package br.com.tws.msauth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class ApiErrorResponse {

    OffsetDateTime timestamp;
    String path;
    int status;
    String error;
    String message;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    List<ApiFieldError> details;

    String traceId;
}
