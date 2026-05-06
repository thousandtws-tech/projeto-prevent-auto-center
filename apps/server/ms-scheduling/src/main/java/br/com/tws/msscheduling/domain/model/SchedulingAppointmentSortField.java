package br.com.tws.msscheduling.domain.model;

import java.util.Arrays;
import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SchedulingAppointmentSortField implements SortField {
    ID("id", "id"),
    STATUS("status", "status"),
    CUSTOMER_NAME("customerName", "customer_name"),
    SERVICE_TYPE("serviceType", "service_type"),
    START_AT("startAt", "start_at"),
    END_AT("endAt", "end_at"),
    CREATED_AT("createdAt", "created_at"),
    UPDATED_AT("updatedAt", "updated_at");

    private final String apiField;
    private final String databaseColumn;

    public static Optional<SchedulingAppointmentSortField> fromApiField(String apiField) {
        return Arrays.stream(values())
                .filter(field -> field.apiField.equalsIgnoreCase(apiField))
                .findFirst();
    }
}
