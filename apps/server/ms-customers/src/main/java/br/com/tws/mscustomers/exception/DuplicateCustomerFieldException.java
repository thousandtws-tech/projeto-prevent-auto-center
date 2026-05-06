package br.com.tws.mscustomers.exception;

import lombok.Getter;

@Getter
public class DuplicateCustomerFieldException extends ConflictException {

    private final String field;
    private final String value;

    public DuplicateCustomerFieldException(String field, String value) {
        super("Ja existe cliente com %s informado.".formatted(resolveLabel(field)));
        this.field = field;
        this.value = value;
    }

    private static String resolveLabel(String field) {
        return switch (field) {
            case "cpfCnpj" -> "CPF/CNPJ";
            case "email" -> "e-mail";
            default -> field;
        };
    }
}
