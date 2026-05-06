package br.com.tws.msserviceorders.dto.response;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class FinancialSummaryResponse {

    BigDecimal serviceOrderRevenue;
    BigDecimal manualIncome;
    BigDecimal pendingIncome;
    BigDecimal paidExpenses;
    BigDecimal pendingExpenses;
    BigDecimal balance;
    BigDecimal projectedBalance;
    Integer serviceOrders;
    Integer paidTransactions;
    Integer pendingTransactions;
    List<CategoryTotalResponse> categoryTotals;

    @Value
    @Builder
    @Jacksonized
    public static class CategoryTotalResponse {
        String type;
        String category;
        BigDecimal amount;
    }
}
