package br.com.tws.msscheduling.domain.model;

import java.util.Locale;
import lombok.Builder;
import org.springframework.data.domain.Sort;

@Builder
public record PageQuery(
        int page,
        int size,
        SortField sortField,
        Sort.Direction direction
) {

    public long offset() {
        return (long) page * size;
    }

    public String sortExpression() {
        return sortField.getApiField() + "," + direction.name().toLowerCase(Locale.ROOT);
    }
}
