package br.com.tws.msscheduling.domain.model;

import java.util.List;
import lombok.Builder;

@Builder
public record PageResult<T>(
        List<T> content,
        PageQuery pageQuery,
        long totalElements
) {
}
