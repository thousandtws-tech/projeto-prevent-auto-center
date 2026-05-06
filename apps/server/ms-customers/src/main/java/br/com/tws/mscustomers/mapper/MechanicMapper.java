package br.com.tws.mscustomers.mapper;

import br.com.tws.mscustomers.domain.entity.MechanicEntity;
import br.com.tws.mscustomers.domain.model.MechanicSearchCriteria;
import br.com.tws.mscustomers.domain.model.MechanicSortField;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.PageResult;
import br.com.tws.mscustomers.dto.request.MechanicSearchRequest;
import br.com.tws.mscustomers.dto.request.MechanicUpsertRequest;
import br.com.tws.mscustomers.dto.response.MechanicResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.exception.BadRequestException;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MechanicMapper {

    public MechanicSearchCriteria toSearchCriteria(MechanicSearchRequest request) {
        return MechanicSearchCriteria.builder()
                .name(normalizeNullableText(request.getName()))
                .phone(normalizeNullableText(request.getPhone()))
                .status(normalizeStatus(request.getStatus()))
                .build();
    }

    public PageQuery toPageQuery(MechanicSearchRequest request) {
        String sortExpression = StringUtils.hasText(request.getSort())
                ? request.getSort().trim()
                : "createdAt,desc";

        String[] tokens = sortExpression.split(",");
        if (tokens.length != 2) {
            throw new BadRequestException("Parametro sort invalido. Use o formato campo,direcao.");
        }

        MechanicSortField sortField = MechanicSortField.fromApiField(tokens[0].trim())
                .orElseThrow(() -> new BadRequestException(
                        "Campo de ordenacao invalido. Valores aceitos: id, name, status, createdAt, updatedAt."
                ));

        Sort.Direction direction = Sort.Direction.fromOptionalString(tokens[1].trim())
                .orElseThrow(() -> new BadRequestException("Direcao de ordenacao invalida. Use asc ou desc."));

        return PageQuery.builder()
                .page(request.getPage())
                .size(request.getSize())
                .sortField(sortField)
                .direction(direction)
                .build();
    }

    public MechanicEntity toNewEntity(Long workshopId, MechanicUpsertRequest request, OffsetDateTime now) {
        return MechanicEntity.builder()
                .workshopId(workshopId)
                .name(normalizeText(request.getName()))
                .phone(normalizeNullableText(request.getPhone()))
                .email(normalizeNullableText(request.getEmail()))
                .status(normalizeStatus(request.getStatus()))
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public MechanicEntity merge(MechanicEntity current, MechanicUpsertRequest request, OffsetDateTime now) {
        return current.toBuilder()
                .name(normalizeText(request.getName()))
                .phone(normalizeNullableText(request.getPhone()))
                .email(normalizeNullableText(request.getEmail()))
                .status(normalizeStatus(request.getStatus()))
                .updatedAt(now)
                .build();
    }

    public MechanicResponse toResponse(MechanicEntity entity) {
        return MechanicResponse.builder()
                .id(entity.getId())
                .status(normalizeStatus(entity.getStatus()))
                .name(defaultText(entity.getName()))
                .phone(defaultText(entity.getPhone()))
                .email(defaultText(entity.getEmail()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public PageResponse<MechanicResponse> toPageResponse(PageResult<MechanicEntity> result) {
        int totalPages = result.getTotalElements() == 0
                ? 0
                : (int) Math.ceil((double) result.getTotalElements() / result.getPageQuery().size());

        List<MechanicResponse> content = result.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.<MechanicResponse>builder()
                .content(content)
                .page(result.getPageQuery().page())
                .size(result.getPageQuery().size())
                .totalElements(result.getTotalElements())
                .totalPages(totalPages)
                .sort(result.getPageQuery().sortExpression())
                .build();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeNullableText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultText(String value) {
        return value != null ? value : "";
    }

    private String normalizeStatus(String value) {
        String normalized = normalizeNullableText(value);
        if ("inactive".equalsIgnoreCase(normalized)) {
            return "inactive";
        }
        return "active";
    }
}

