package br.com.tws.msscheduling.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class PageResponse<T> {

    List<T> content;
    int page;
    int size;
    long totalElements;
    int totalPages;
    String sort;
}
