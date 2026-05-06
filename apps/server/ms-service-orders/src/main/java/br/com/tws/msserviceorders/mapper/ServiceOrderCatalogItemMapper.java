package br.com.tws.msserviceorders.mapper;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderCatalogItemEntity;
import br.com.tws.msserviceorders.dto.request.ServiceOrderCatalogItemUpsertRequest;
import br.com.tws.msserviceorders.dto.response.ServiceOrderCatalogItemResponse;
import br.com.tws.msserviceorders.exception.BadRequestException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ServiceOrderCatalogItemMapper {

    public ServiceOrderCatalogItemEntity toNewEntity(
            Long workshopId,
            ServiceOrderCatalogItemUpsertRequest request,
            OffsetDateTime now
    ) {
        return ServiceOrderCatalogItemEntity.builder()
                .workshopId(workshopId)
                .type(normalizeType(request.getType()))
                .code(normalizeNullableText(request.getCode()))
                .description(normalizeText(request.getDescription()))
                .defaultPrice(defaultDecimal(request.getDefaultPrice()))
                .costPrice(normalizePartDecimal(request.getCostPrice(), request.getType()))
                .profitMarginPercent(normalizePartDecimal(
                        request.getProfitMarginPercent(),
                        request.getType()
                ))
                .stockQuantity(normalizeStockQuantity(request.getStockQuantity(), request.getType()))
                .estimatedDurationMinutes(normalizeEstimatedDurationMinutes(
                        request.getEstimatedDurationMinutes(),
                        request.getType()
                ))
                .partCondition(normalizePartCondition(request.getPartCondition(), request.getType()))
                .status(normalizeStatus(request.getStatus()))
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public ServiceOrderCatalogItemEntity merge(
            ServiceOrderCatalogItemEntity current,
            ServiceOrderCatalogItemUpsertRequest request,
            OffsetDateTime now
    ) {
        String normalizedType = normalizeType(request.getType());
        if (!current.getType().equals(normalizedType)) {
            throw new BadRequestException("Nao e permitido alterar o tipo do item de catalogo.");
        }

        return current.toBuilder()
                .code(normalizeNullableText(request.getCode()))
                .description(normalizeText(request.getDescription()))
                .defaultPrice(defaultDecimal(request.getDefaultPrice()))
                .costPrice(normalizePartDecimal(request.getCostPrice(), current.getType()))
                .profitMarginPercent(normalizePartDecimal(
                        request.getProfitMarginPercent(),
                        current.getType()
                ))
                .stockQuantity(normalizeStockQuantity(request.getStockQuantity(), current.getType()))
                .estimatedDurationMinutes(normalizeEstimatedDurationMinutes(
                        request.getEstimatedDurationMinutes(),
                        current.getType()
                ))
                .partCondition(normalizePartCondition(request.getPartCondition(), current.getType()))
                .status(normalizeStatus(request.getStatus()))
                .updatedAt(now)
                .build();
    }

    public ServiceOrderCatalogItemResponse toResponse(ServiceOrderCatalogItemEntity entity) {
        return ServiceOrderCatalogItemResponse.builder()
                .id(entity.getId())
                .type(normalizeType(entity.getType()))
                .code(entity.getCode())
                .description(entity.getDescription())
                .defaultPrice(defaultDecimal(entity.getDefaultPrice()))
                .costPrice(normalizePartDecimal(entity.getCostPrice(), entity.getType()))
                .profitMarginPercent(normalizePartDecimal(
                        entity.getProfitMarginPercent(),
                        entity.getType()
                ))
                .stockQuantity(normalizeStockQuantity(entity.getStockQuantity(), entity.getType()))
                .estimatedDurationMinutes(normalizeEstimatedDurationMinutes(
                        entity.getEstimatedDurationMinutes(),
                        entity.getType()
                ))
                .partCondition(normalizePartCondition(entity.getPartCondition(), entity.getType()))
                .status(normalizeStatus(entity.getStatus()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public String normalizeType(String value) {
        String normalized = normalizeNullableText(value);
        if ("part".equalsIgnoreCase(normalized)) {
            return "part";
        }

        if ("labor".equalsIgnoreCase(normalized)) {
            return "labor";
        }

        throw new BadRequestException("type invalido. Valores aceitos: part, labor.");
    }

    public String normalizePartCondition(String value, String type) {
        String normalizedType = normalizeType(type);
        if (!"part".equals(normalizedType)) {
            return null;
        }

        String normalized = normalizeNullableText(value);
        if (!StringUtils.hasText(normalized) || "new".equalsIgnoreCase(normalized)) {
            return "new";
        }

        if ("used".equalsIgnoreCase(normalized)) {
            return "used";
        }

        throw new BadRequestException("partCondition invalido. Valores aceitos: new, used.");
    }

    public Integer normalizeEstimatedDurationMinutes(Integer value, String type) {
        String normalizedType = normalizeType(type);
        if (!"labor".equals(normalizedType)) {
            return null;
        }

        if (value == null || value <= 0) {
            return 60;
        }

        return value;
    }

    public BigDecimal normalizePartDecimal(BigDecimal value, String type) {
        String normalizedType = normalizeType(type);
        if (!"part".equals(normalizedType)) {
            return BigDecimal.ZERO;
        }

        return defaultDecimal(value);
    }

    public Integer normalizeStockQuantity(Integer value, String type) {
        String normalizedType = normalizeType(type);
        if (!"part".equals(normalizedType)) {
            return 0;
        }

        return value != null ? Math.max(0, value) : 0;
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String normalizeStatus(String value) {
        String normalized = normalizeNullableText(value);
        if (!StringUtils.hasText(normalized) || "active".equalsIgnoreCase(normalized)) {
            return "active";
        }

        if ("inactive".equalsIgnoreCase(normalized)) {
            return "inactive";
        }

        throw new BadRequestException("status invalido. Valores aceitos: active, inactive.");
    }

    private String normalizeText(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullableText(String value) {
        return StringUtils.hasText(value) ? normalizeText(value) : null;
    }
}
