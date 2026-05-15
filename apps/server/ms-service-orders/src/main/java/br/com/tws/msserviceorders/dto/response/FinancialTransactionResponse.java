package br.com.tws.msserviceorders.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class FinancialTransactionResponse {

    Long id;
    String type;
    String status;
    String description;
    String category;
    String expenseClassification;
    String paymentMethod;
    BigDecimal amount;
    LocalDate dueDate;
    OffsetDateTime paidAt;
    Long supplierId;
    Long serviceOrderId;
    String notes;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;
}
