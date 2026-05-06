package br.com.tws.mscustomers.validation.strategy;

public interface DocumentValidationStrategy {

    boolean supports(String normalizedDocument);

    boolean isValid(String normalizedDocument);
}
