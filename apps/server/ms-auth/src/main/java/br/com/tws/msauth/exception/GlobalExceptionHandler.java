package br.com.tws.msauth.exception;

import br.com.tws.msauth.dto.response.ApiErrorResponse;
import br.com.tws.msauth.dto.response.ApiFieldError;
import io.r2dbc.spi.R2dbcDataIntegrityViolationException;
import jakarta.validation.ConstraintViolationException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(WebExchangeBindException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            WebExchangeBindException exception,
            ServerWebExchange exchange
    ) {
        List<ApiFieldError> details = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldError)
                .toList();

        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Erro de validacao na requisicao.", details, exchange);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException exception,
            ServerWebExchange exchange
    ) {
        List<ApiFieldError> details = exception.getConstraintViolations()
                .stream()
                .map(violation -> ApiFieldError.builder()
                        .field(violation.getPropertyPath().toString())
                        .message(violation.getMessage())
                        .rejectedValue(violation.getInvalidValue())
                        .build())
                .toList();

        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Erro de validacao na requisicao.", details, exchange);
    }

    @ExceptionHandler(ServerWebInputException.class)
    public ResponseEntity<ApiErrorResponse> handleServerWebInputException(
            ServerWebInputException exception,
            ServerWebExchange exchange
    ) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Requisicao invalida.", List.of(), exchange);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequestException(
            BadRequestException exception,
            ServerWebExchange exchange
    ) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), List.of(), exchange);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException exception,
            ServerWebExchange exchange
    ) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, exception.getMessage(), List.of(), exchange);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorizedException(
            UnauthorizedException exception,
            ServerWebExchange exchange
    ) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, exception.getMessage(), List.of(), exchange);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiErrorResponse> handleForbiddenException(
            ForbiddenException exception,
            ServerWebExchange exchange
    ) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, exception.getMessage(), List.of(), exchange);
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleServiceUnavailableException(
            ServiceUnavailableException exception,
            ServerWebExchange exchange
    ) {
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage(), List.of(), exchange);
    }

    @ExceptionHandler({
            ConflictException.class,
            DataIntegrityViolationException.class,
            R2dbcDataIntegrityViolationException.class
    })
    public ResponseEntity<ApiErrorResponse> handleConflictException(
            Exception exception,
            ServerWebExchange exchange
    ) {
        String message = exception instanceof ConflictException
                ? exception.getMessage()
                : "Violacao de integridade de dados.";

        return buildErrorResponse(HttpStatus.CONFLICT, message, List.of(), exchange);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(
            ResponseStatusException exception,
            ServerWebExchange exchange
    ) {
        HttpStatusCode statusCode = exception.getStatusCode();
        String message = exception.getReason() != null ? exception.getReason() : resolveReasonPhrase(statusCode);

        return buildErrorResponse(statusCode, message, List.of(), exchange);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception,
            ServerWebExchange exchange
    ) {
        log.error("Erro inesperado no processamento da requisicao {}", exchange.getRequest().getId(), exception);

        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha interna inesperada ao processar a requisicao.",
                List.of(),
                exchange
        );
    }

    private ResponseEntity<ApiErrorResponse> buildErrorResponse(
            HttpStatusCode status,
            String message,
            List<ApiFieldError> details,
            ServerWebExchange exchange
    ) {
        ApiErrorResponse body = ApiErrorResponse.builder()
                .timestamp(OffsetDateTime.now(ZoneOffset.UTC))
                .path(exchange.getRequest().getPath().value())
                .status(status.value())
                .error(resolveReasonPhrase(status))
                .message(message)
                .details(details)
                .traceId(resolveTraceId(exchange))
                .build();

        return ResponseEntity.status(status).body(body);
    }

    private ApiFieldError toFieldError(FieldError fieldError) {
        return ApiFieldError.builder()
                .field(fieldError.getField())
                .message(fieldError.getDefaultMessage())
                .rejectedValue(fieldError.getRejectedValue())
                .build();
    }

    private String resolveTraceId(ServerWebExchange exchange) {
        String traceId = exchange.getRequest().getHeaders().getFirst("X-B3-TraceId");
        return traceId != null ? traceId : exchange.getRequest().getId();
    }

    private String resolveReasonPhrase(HttpStatusCode status) {
        HttpStatus httpStatus = HttpStatus.resolve(status.value());
        return httpStatus != null ? httpStatus.getReasonPhrase() : "HTTP " + status.value();
    }
}
