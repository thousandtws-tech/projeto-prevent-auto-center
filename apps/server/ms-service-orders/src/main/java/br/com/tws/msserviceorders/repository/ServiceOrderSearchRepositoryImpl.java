package br.com.tws.msserviceorders.repository;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderEntity;
import br.com.tws.msserviceorders.domain.model.PageQuery;
import br.com.tws.msserviceorders.domain.model.ServiceOrderSearchCriteria;
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
public class ServiceOrderSearchRepositoryImpl implements ServiceOrderSearchRepository {

    private static final String BASE_SELECT = """
            SELECT id, workshop_id, status, order_number, customer_name, payload_json, signature_token,
                   signature_link, signature_status, signer_name, signed_at, created_at, updated_at
            FROM service_orders
            """;

    private final DatabaseClient databaseClient;

    @Override
    public Flux<ServiceOrderEntity> search(Long workshopId, ServiceOrderSearchCriteria criteria, PageQuery pageQuery) {
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

        return executeSpec.map((row, metadata) -> ServiceOrderEntity.builder()
                .id(row.get("id", Long.class))
                .workshopId(row.get("workshop_id", Long.class))
                .status(row.get("status", String.class))
                .orderNumber(row.get("order_number", String.class))
                .customerName(row.get("customer_name", String.class))
                .payloadJson(row.get("payload_json", String.class))
                .signatureToken(row.get("signature_token", String.class))
                .signatureLink(row.get("signature_link", String.class))
                .signatureStatus(row.get("signature_status", String.class))
                .signerName(row.get("signer_name", String.class))
                .signedAt(row.get("signed_at", OffsetDateTime.class))
                .createdAt(row.get("created_at", OffsetDateTime.class))
                .updatedAt(row.get("updated_at", OffsetDateTime.class))
                .build()).all();
    }

    @Override
    public Mono<Long> count(Long workshopId, ServiceOrderSearchCriteria criteria) {
        SqlParts sqlParts = buildWhereClause(workshopId, criteria);
        String sql = "SELECT COUNT(*) AS total FROM service_orders" + sqlParts.whereClause();

        return bind(databaseClient.sql(sql), sqlParts.bindings())
                .map((row, metadata) -> row.get("total", Long.class))
                .one()
                .defaultIfEmpty(0L);
    }

    private SqlParts buildWhereClause(Long workshopId, ServiceOrderSearchCriteria criteria) {
        List<String> clauses = new ArrayList<>();
        Map<String, Object> bindings = new LinkedHashMap<>();

        clauses.add("workshop_id = :workshopId");
        bindings.put("workshopId", workshopId);

        if (StringUtils.hasText(criteria.status())) {
            clauses.add("status = :status");
            bindings.put("status", criteria.status());
        }

        if (StringUtils.hasText(criteria.signatureStatus())) {
            clauses.add("signature_status = :signatureStatus");
            bindings.put("signatureStatus", criteria.signatureStatus());
        }

        if (StringUtils.hasText(criteria.orderNumber())) {
            clauses.add("order_number ILIKE :orderNumber");
            bindings.put("orderNumber", "%" + criteria.orderNumber() + "%");
        }

        if (StringUtils.hasText(criteria.customerName())) {
            clauses.add("customer_name ILIKE :customerName");
            bindings.put("customerName", "%" + criteria.customerName() + "%");
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
