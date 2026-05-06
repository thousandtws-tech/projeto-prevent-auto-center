package br.com.tws.mscustomers.domain.model;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VehicleSortField implements SortField {
    ID("id", "id"),
    MODELO("modelo", "modelo"),
    BRAND("brand", "marca"),
    PLATE("plate", "placa"),
    CHASSI_NUMBER("chassiNumber", "chassi"),
    MILEAGE("mileage", "quilometragem"),
    YEAR("year", "ano"),
    COLOR("color", "cor");

    private final String apiField;
    private final String databaseColumn;

    public static Optional<VehicleSortField> fromApiField(String apiField) {
        return Arrays.stream(values())
                .filter(field -> field.apiField.equals(apiField))
                .findFirst();
    }
}
