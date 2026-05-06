package br.com.tws.monolith.exception;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
import io.r2dbc.spi.R2dbcDataIntegrityViolationException;
import jakarta.validation.ConstraintViolationException;

@Slf4j
@RestControllerAdvice
public class MonolithGlobalExceptionHandler {

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
                .map(violation -> new ApiFieldError(
                        violation.getPropertyPath().toString(),
                        violation.getMessage(),
                        violation.getInvalidValue()
                ))
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

    @ExceptionHandler({
            DataIntegrityViolationException.class,
            R2dbcDataIntegrityViolationException.class
    })
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
            Exception exception,
            ServerWebExchange exchange
    ) {
        return buildErrorResponse(HttpStatus.CONFLICT, "Violacao de integridade de dados.", List.of(), exchange);
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
        HttpStatusCode status = resolveStatus(exception);
        String message = status.value() == HttpStatus.INTERNAL_SERVER_ERROR.value()
                ? "Falha interna inesperada ao processar a requisicao."
                : exception.getMessage();

        if (status.value() == HttpStatus.INTERNAL_SERVER_ERROR.value()) {
            log.error("Erro inesperado no processamento da requisicao {}", exchange.getRequest().getId(), exception);
        }

        return buildErrorResponse(status, message, List.of(), exchange);
    }

    private HttpStatusCode resolveStatus(Exception exception) {
        String simpleName = exception.getClass().getSimpleName();

        if ("BadRequestException".equals(simpleName)) {
            return HttpStatus.BAD_REQUEST;
        }
        if ("UnauthorizedException".equals(simpleName) || "InvalidCredentialsException".equals(simpleName)) {
            return HttpStatus.UNAUTHORIZED;
        }
        if ("ForbiddenException".equals(simpleName)) {
            return HttpStatus.FORBIDDEN;
        }
        if ("ServiceUnavailableException".equals(simpleName)) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }
        if ("ConflictException".equals(simpleName)
                || simpleName.startsWith("Duplicate")
                || simpleName.endsWith("AlreadyExistsException")) {
            return HttpStatus.CONFLICT;
        }
        if ("ResourceNotFoundException".equals(simpleName) || simpleName.endsWith("NotFoundException")) {
            return HttpStatus.NOT_FOUND;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private ResponseEntity<ApiErrorResponse> buildErrorResponse(
            HttpStatusCode status,
            String message,
            List<ApiFieldError> details,
            ServerWebExchange exchange
    ) {
        ApiErrorResponse body = new ApiErrorResponse(
                OffsetDateTime.now(ZoneOffset.UTC),
                exchange.getRequest().getPath().value(),
                status.value(),
                resolveReasonPhrase(status),
                message,
                details,
                resolveTraceId(exchange)
        );

        return ResponseEntity.status(status).body(body);
    }

    private ApiFieldError toFieldError(FieldError fieldError) {
        return new ApiFieldError(
                fieldError.getField(),
                fieldError.getDefaultMessage(),
                fieldError.getRejectedValue()
        );
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
