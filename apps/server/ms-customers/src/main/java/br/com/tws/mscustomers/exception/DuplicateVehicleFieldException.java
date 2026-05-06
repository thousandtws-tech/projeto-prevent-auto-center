package br.com.tws.mscustomers.exception;

import lombok.Getter;

@Getter
public class DuplicateVehicleFieldException extends ConflictException {

    private final String field;
    private final String value;

    public DuplicateVehicleFieldException(String field, String value) {
        super("Ja existe veiculo com %s informado.".formatted(resolveLabel(field)));
        this.field = field;
        this.value = value;
    }

    private static String resolveLabel(String field) {
        return switch (field) {
            case "plate" -> "placa";
            case "chassiNumber" -> "chassi";
            default -> field;
        };
    }
}
