package br.com.tws.monolith.exception;

public record ApiFieldError(
        String field,
        String message,
        Object rejectedValue
) {
}
