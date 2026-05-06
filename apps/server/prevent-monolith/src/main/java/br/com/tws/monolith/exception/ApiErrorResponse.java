package br.com.tws.monolith.exception;

import java.time.OffsetDateTime;
import java.util.List;

public record ApiErrorResponse(
        OffsetDateTime timestamp,
        String path,
        int status,
        String error,
        String message,
        List<ApiFieldError> details,
        String traceId
) {
}
