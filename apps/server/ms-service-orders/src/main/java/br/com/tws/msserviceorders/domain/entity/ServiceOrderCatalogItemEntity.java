package br.com.tws.msserviceorders.domain.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Table("service_order_catalog_items")
public class ServiceOrderCatalogItemEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    private String type;

    private String code;

    private String description;

    @Column("default_price")
    private BigDecimal defaultPrice;

    @Column("cost_price")
    private BigDecimal costPrice;

    @Column("profit_margin_percent")
    private BigDecimal profitMarginPercent;

    @Column("stock_quantity")
    private Integer stockQuantity;

    @Column("estimated_duration_minutes")
    private Integer estimatedDurationMinutes;

    @Column("part_condition")
    private String partCondition;

    private String status;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
