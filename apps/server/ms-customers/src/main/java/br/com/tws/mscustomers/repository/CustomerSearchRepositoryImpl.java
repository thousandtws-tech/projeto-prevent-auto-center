package br.com.tws.mscustomers.repository;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.model.CustomerSearchCriteria;
import br.com.tws.mscustomers.domain.model.PageQuery;
import java.time.LocalDate;
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
public class CustomerSearchRepositoryImpl implements CustomerSearchRepository {

    private static final String BASE_SELECT = """
            SELECT id, workshop_id, nome_completo, telefone, cpf_cnpj, email, data_nascimento, endereco, cep, logradouro, numero, complemento, bairro, cidade, uf, created_at, updated_at
            FROM customers
            """;

    private final DatabaseClient databaseClient;

    @Override
    public Flux<CustomerEntity> search(Long workshopId, CustomerSearchCriteria criteria, PageQuery pageQuery) {
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

        return executeSpec.map((row, metadata) -> CustomerEntity.builder()
                .id(row.get("id", Long.class))
                .workshopId(row.get("workshop_id", Long.class))
                .nomeCompleto(row.get("nome_completo", String.class))
                .telefone(row.get("telefone", String.class))
                .cpfCnpj(row.get("cpf_cnpj", String.class))
                .email(row.get("email", String.class))
                .dataNascimento(row.get("data_nascimento", LocalDate.class))
                .endereco(row.get("endereco", String.class))
                .cep(row.get("cep", String.class))
                .logradouro(row.get("logradouro", String.class))
                .numero(row.get("numero", String.class))
                .complemento(row.get("complemento", String.class))
                .bairro(row.get("bairro", String.class))
                .cidade(row.get("cidade", String.class))
                .uf(row.get("uf", String.class))
                .createdAt(row.get("created_at", OffsetDateTime.class))
                .updatedAt(row.get("updated_at", OffsetDateTime.class))
                .build()).all();
    }

    @Override
    public Mono<Long> count(Long workshopId, CustomerSearchCriteria criteria) {
        SqlParts sqlParts = buildWhereClause(workshopId, criteria);
        String sql = "SELECT COUNT(*) AS total FROM customers" + sqlParts.whereClause();

        return bind(databaseClient.sql(sql), sqlParts.bindings())
                .map((row, metadata) -> row.get("total", Long.class))
                .one()
                .defaultIfEmpty(0L);
    }

    private SqlParts buildWhereClause(Long workshopId, CustomerSearchCriteria criteria) {
        List<String> clauses = new ArrayList<>();
        Map<String, Object> bindings = new LinkedHashMap<>();

        clauses.add("workshop_id = :workshopId");
        bindings.put("workshopId", workshopId);

        if (StringUtils.hasText(criteria.nomeCompleto())) {
            clauses.add("nome_completo ILIKE :nomeCompleto");
            bindings.put("nomeCompleto", "%" + criteria.nomeCompleto() + "%");
        }

        if (StringUtils.hasText(criteria.telefone())) {
            clauses.add("telefone LIKE :telefone");
            bindings.put("telefone", "%" + criteria.telefone() + "%");
        }

        if (StringUtils.hasText(criteria.cpfCnpj())) {
            clauses.add("cpf_cnpj = :cpfCnpj");
            bindings.put("cpfCnpj", criteria.cpfCnpj());
        }

        if (StringUtils.hasText(criteria.email())) {
            clauses.add("email ILIKE :email");
            bindings.put("email", "%" + criteria.email() + "%");
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
