package br.com.tws.msserviceorders.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class ApiFieldError {

    String field;
    String message;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    Object rejectedValue;
}
