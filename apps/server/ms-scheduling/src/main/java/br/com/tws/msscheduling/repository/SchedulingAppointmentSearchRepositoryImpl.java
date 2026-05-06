package br.com.tws.msscheduling.repository;

import br.com.tws.msscheduling.domain.entity.SchedulingAppointmentEntity;
import br.com.tws.msscheduling.domain.model.PageQuery;
import br.com.tws.msscheduling.domain.model.SchedulingAppointmentSearchCriteria;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class SchedulingAppointmentSearchRepositoryImpl implements SchedulingAppointmentSearchRepository {

    private static final String BASE_SELECT = """
            SELECT id, workshop_id, status, customer_id, customer_name, customer_phone, customer_email,
                   vehicle_model, vehicle_plate, service_type, mechanic_responsible, notes, start_at, end_at, duration_minutes,
                   timezone, integration_provider, integration_last_attempt_at, integration_last_error,
                   integration_event_id, integration_event_link, integration_response_message,
                   service_order_id, service_order_number, created_at, updated_at
            FROM scheduling_appointments
            """;

    private final DatabaseClient databaseClient;

    @Override
    public Flux<SchedulingAppointmentEntity> search(
            Long workshopId,
            SchedulingAppointmentSearchCriteria criteria,
            PageQuery pageQuery
    ) {
        SqlParts sqlParts = buildWhereClause(workshopId, criteria);
        String sql = BASE_SELECT
                + sqlParts.whereClause()
                + " ORDER BY "
                + pageQuery.sortField().getDatabaseColumn()
                + " "
                + pageQuery.direction().name()
                + " LIMIT :limit OFFSET :offset";

        DatabaseClient.GenericExecuteSpec executeSpec = bind(databaseClient.sql(sql), sqlParts.bindings())
                .bind("limit", pageQuery.size())
                .bind("offset", pageQuery.offset());

        return executeSpec.map((row, metadata) -> SchedulingAppointmentEntity.builder()
                .id(row.get("id", Long.class))
                .workshopId(row.get("workshop_id", Long.class))
                .status(row.get("status", String.class))
                .customerId(row.get("customer_id", Long.class))
                .customerName(row.get("customer_name", String.class))
                .customerPhone(row.get("customer_phone", String.class))
                .customerEmail(row.get("customer_email", String.class))
                .vehicleModel(row.get("vehicle_model", String.class))
                .vehiclePlate(row.get("vehicle_plate", String.class))
                .serviceType(row.get("service_type", String.class))
                .mechanicResponsible(row.get("mechanic_responsible", String.class))
                .notes(row.get("notes", String.class))
                .startAt(row.get("start_at", OffsetDateTime.class))
                .endAt(row.get("end_at", OffsetDateTime.class))
                .durationMinutes(row.get("duration_minutes", Integer.class))
                .timezone(row.get("timezone", String.class))
                .integrationProvider(row.get("integration_provider", String.class))
                .integrationLastAttemptAt(row.get("integration_last_attempt_at", OffsetDateTime.class))
                .integrationLastError(row.get("integration_last_error", String.class))
                .integrationEventId(row.get("integration_event_id", String.class))
                .integrationEventLink(row.get("integration_event_link", String.class))
                .integrationResponseMessage(row.get("integration_response_message", String.class))
                .serviceOrderId(row.get("service_order_id", Long.class))
                .serviceOrderNumber(row.get("service_order_number", String.class))
                .createdAt(row.get("created_at", OffsetDateTime.class))
                .updatedAt(row.get("updated_at", OffsetDateTime.class))
                .build()).all();
    }

    @Override
    public Mono<Long> count(Long workshopId, SchedulingAppointmentSearchCriteria criteria) {
        SqlParts sqlParts = buildWhereClause(workshopId, criteria);
        String sql = "SELECT COUNT(*) AS total FROM scheduling_appointments" + sqlParts.whereClause();

        return bind(databaseClient.sql(sql), sqlParts.bindings())
                .map((row, metadata) -> row.get("total", Long.class))
                .one()
                .defaultIfEmpty(0L);
    }

    private SqlParts buildWhereClause(Long workshopId, SchedulingAppointmentSearchCriteria criteria) {
        List<String> clauses = new ArrayList<>();
        Map<String, Object> bindings = new LinkedHashMap<>();

        clauses.add("workshop_id = :workshopId");
        bindings.put("workshopId", workshopId);

        if (StringUtils.hasText(criteria.status())) {
            clauses.add("status = :status");
            bindings.put("status", criteria.status());
        }

        if (StringUtils.hasText(criteria.customerName())) {
            clauses.add("customer_name ILIKE :customerName");
            bindings.put("customerName", "%" + criteria.customerName() + "%");
        }

        if (StringUtils.hasText(criteria.serviceType())) {
            clauses.add("service_type ILIKE :serviceType");
            bindings.put("serviceType", "%" + criteria.serviceType() + "%");
        }

        if (StringUtils.hasText(criteria.mechanicResponsible())) {
            clauses.add("mechanic_responsible ILIKE :mechanicResponsible");
            bindings.put("mechanicResponsible", "%" + criteria.mechanicResponsible() + "%");
        }

        return new SqlParts(" WHERE " + String.join(" AND ", clauses), bindings);
    }

    private DatabaseClient.GenericExecuteSpec bind(
            DatabaseClient.GenericExecuteSpec executeSpec,
            Map<String, Object> bindings
    ) {
        DatabaseClient.GenericExecuteSpec spec = executeSpec;
        for (Map.Entry<String, Object> entry : bindings.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec;
    }

    private record SqlParts(String whereClause, Map<String, Object> bindings) {
    }
}
