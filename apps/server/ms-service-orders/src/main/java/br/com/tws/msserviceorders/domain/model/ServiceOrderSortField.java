package br.com.tws.msserviceorders.domain.model;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ServiceOrderSortField implements SortField {
    ID("id", "id"),
    ORDER_NUMBER("orderNumber", "order_number"),
    CUSTOMER_NAME("customerName", "customer_name"),
    STATUS("status", "status"),
    CREATED_AT("createdAt", "created_at"),
    UPDATED_AT("updatedAt", "updated_at");

    private final String apiField;
    private final String databaseColumn;

    public static Optional<ServiceOrderSortField> fromApiField(String apiField) {
        return Arrays.stream(values())
                .filter(field -> field.apiField.equals(apiField))
                .findFirst();
    }
}
