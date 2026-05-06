package br.com.tws.msserviceorders.domain.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
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
@Table("financial_transactions")
public class FinancialTransactionEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    private String type;

    private String status;

    private String description;

    private String category;

    @Column("payment_method")
    private String paymentMethod;

    private BigDecimal amount;

    @Column("due_date")
    private LocalDate dueDate;

    @Column("paid_at")
    private OffsetDateTime paidAt;

    @Column("supplier_id")
    private Long supplierId;

    @Column("service_order_id")
    private Long serviceOrderId;

    private String notes;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
