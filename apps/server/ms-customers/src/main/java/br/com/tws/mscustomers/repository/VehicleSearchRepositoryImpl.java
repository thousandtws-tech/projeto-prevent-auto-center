package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.VehicleSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class VehicleSearchRepositoryImpl implements VehicleSearchRepository {

    private static final String BASE_SELECT = """
            SELECT id, workshop_id, modelo, marca, placa, chassi, quilometragem, ano, cor
            FROM vehicles
            """;

    private final DatabaseClient databaseClient;

    @Override
    public Flux<VehicleEntity> search(Long workshopId, VehicleSearchCriteria criteria, PageQuery pageQuery) {
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

        return executeSpec.map((row, metadata) -> VehicleEntity.builder()
                .id(row.get("id", Long.class))
                .workshopId(row.get("workshop_id", Long.class))
                .model(row.get("modelo", String.class))
                .brand(row.get("marca", String.class))
                .plate(row.get("placa", String.class))
                .chassisNumber(row.get("chassi", String.class))
                .mileage(row.get("quilometragem", Long.class))
                .year(row.get("ano", Long.class))
                .color(row.get("cor", String.class))
                .build()).all();
    }

    @Override
    public Mono<Long> count(Long workshopId, VehicleSearchCriteria criteria) {
        SqlParts sqlParts = buildWhereClause(workshopId, criteria);
        String sql = "SELECT COUNT(*) AS total FROM vehicles" + sqlParts.whereClause();

        return bind(databaseClient.sql(sql), sqlParts.bindings())
                .map((row, metadata) -> row.get("total", Long.class))
                .one()
                .defaultIfEmpty(0L);
    }

    private SqlParts buildWhereClause(Long workshopId, VehicleSearchCriteria criteria) {
        List<String> clauses = new ArrayList<>();
        Map<String, Object> bindings = new LinkedHashMap<>();

        clauses.add("workshop_id = :workshopId");
        bindings.put("workshopId", workshopId);

        if (StringUtils.hasText(criteria.modelo())) {
            clauses.add("modelo ILIKE :modelo");
            bindings.put("modelo", "%" + criteria.modelo() + "%");
        }

        if (StringUtils.hasText(criteria.brand())) {
            clauses.add("marca ILIKE :brand");
            bindings.put("brand", "%" + criteria.brand() + "%");
        }

        if (StringUtils.hasText(criteria.plate())) {
            clauses.add("placa ILIKE :plate");
            bindings.put("plate", "%" + criteria.plate() + "%");
        }

        if (StringUtils.hasText(criteria.chassiNumber())) {
            clauses.add("chassi = :chassiNumber");
            bindings.put("chassiNumber", criteria.chassiNumber());
        }

        if (criteria.mileage() != null) {
            clauses.add("quilometragem = :mileage");
            bindings.put("mileage", criteria.mileage());
        }

        if (criteria.year() != null) {
            clauses.add("ano = :year");
            bindings.put("year", criteria.year());
        }

        if (StringUtils.hasText(criteria.color())) {
            clauses.add("cor ILIKE :color");
            bindings.put("color", "%" + criteria.color() + "%");
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

    private static final class SqlParts {
        private final String whereClause;
        private final Map<String, Object> bindings;

        SqlParts(String whereClause, Map<String, Object> bindings) {
            this.whereClause = whereClause;
            this.bindings = bindings;
        }

        String whereClause() {
            return whereClause;
        }

        Map<String, Object> bindings() {
            return bindings;
        }
    }
}
