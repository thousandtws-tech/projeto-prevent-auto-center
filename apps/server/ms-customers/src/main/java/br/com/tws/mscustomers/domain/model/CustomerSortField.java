package br.com.tws.mscustomers.domain.model;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CustomerSortField implements SortField {
    ID("id", "id"),
    NOME_COMPLETO("nomeCompleto", "nome_completo"),
    TELEFONE("telefone", "telefone"),
    EMAIL("email", "email"),
    CREATED_AT("createdAt", "created_at"),
    UPDATED_AT("updatedAt", "updated_at");

    private final String apiField;
    private final String databaseColumn;

    public static Optional<CustomerSortField> fromApiField(String apiField) {
        return Arrays.stream(values())
                .filter(field -> field.apiField.equals(apiField))
                .findFirst();
    }
}
