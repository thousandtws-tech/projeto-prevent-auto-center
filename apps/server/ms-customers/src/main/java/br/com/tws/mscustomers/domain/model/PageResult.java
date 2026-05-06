package br.com.tws.mscustomers.domain.model;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PageResult<T> {

    List<T> content;
    PageQuery pageQuery;
    long totalElements;
}
