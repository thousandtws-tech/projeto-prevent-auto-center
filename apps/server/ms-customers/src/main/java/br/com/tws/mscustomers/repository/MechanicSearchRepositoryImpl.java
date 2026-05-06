package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.MechanicEntity;
import br.com.tws.mscustomers.domain.model.MechanicSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
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
public class MechanicSearchRepositoryImpl implements MechanicSearchRepository {

    private static final String BASE_SELECT = """
            SELECT id, workshop_id, name, phone, email, status, created_at, updated_at
            FROM mechanics
            """;

    private final DatabaseClient databaseClient;

    @Override
    public Flux<MechanicEntity> search(Long workshopId, MechanicSearchCriteria criteria, PageQuery pageQuery) {
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

        return executeSpec.map((row, metadata) -> MechanicEntity.builder()
                .id(row.get("id", Long.class))
                .workshopId(row.get("workshop_id", Long.class))
                .name(row.get("name", String.class))
                .phone(row.get("phone", String.class))
                .email(row.get("email", String.class))
                .status(row.get("status", String.class))
                .createdAt(row.get("created_at", OffsetDateTime.class))
                .updatedAt(row.get("updated_at", OffsetDateTime.class))
                .build()).all();
    }

    @Override
    public Mono<Long> count(Long workshopId, MechanicSearchCriteria criteria) {
        SqlParts sqlParts = buildWhereClause(workshopId, criteria);
        String sql = "SELECT COUNT(*) AS total FROM mechanics" + sqlParts.whereClause();

        return bind(databaseClient.sql(sql), sqlParts.bindings())
                .map((row, metadata) -> row.get("total", Long.class))
                .one()
                .defaultIfEmpty(0L);
    }

    private SqlParts buildWhereClause(Long workshopId, MechanicSearchCriteria criteria) {
        List<String> clauses = new ArrayList<>();
        Map<String, Object> bindings = new LinkedHashMap<>();

        clauses.add("workshop_id = :workshopId");
        bindings.put("workshopId", workshopId);

        if (StringUtils.hasText(criteria.name())) {
            clauses.add("name ILIKE :name");
            bindings.put("name", "%" + criteria.name() + "%");
        }

        if (StringUtils.hasText(criteria.phone())) {
            clauses.add("phone LIKE :phone");
            bindings.put("phone", "%" + criteria.phone() + "%");
        }

        if (StringUtils.hasText(criteria.status())) {
            clauses.add("status = :status");
            bindings.put("status", criteria.status());
        }

        String whereClause = " WHERE " + String.join(" AND ", clauses);
        return new SqlParts(whereClause, bindings);
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

