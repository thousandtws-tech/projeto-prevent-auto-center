package br.com.tws.mscustomers.domain.model;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MechanicSortField implements SortField {
    ID("id", "id"),
    NAME("name", "name"),
    STATUS("status", "status"),
    CREATED_AT("createdAt", "created_at"),
    UPDATED_AT("updatedAt", "updated_at");

    private final String apiField;
    private final String databaseColumn;

    public static Optional<MechanicSortField> fromApiField(String apiField) {
        return Arrays.stream(values())
                .filter(field -> field.apiField.equals(apiField))
                .findFirst();
    }
}

