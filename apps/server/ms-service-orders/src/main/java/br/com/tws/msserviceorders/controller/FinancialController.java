package br.com.tws.msserviceorders.controller;

import br.com.tws.msserviceorders.domain.entity.FinancialTransactionEntity;
import br.com.tws.msserviceorders.dto.request.FinancialTransactionRequest;
import br.com.tws.msserviceorders.dto.response.FinancialSummaryResponse;
import br.com.tws.msserviceorders.dto.response.FinancialTransactionResponse;
import br.com.tws.msserviceorders.exception.BadRequestException;
import br.com.tws.msserviceorders.exception.ResourceNotFoundException;
import br.com.tws.msserviceorders.mapper.ServiceOrderMapper;
import br.com.tws.msserviceorders.repository.FinancialTransactionRepository;
import br.com.tws.msserviceorders.repository.ServiceOrderRepository;
import br.com.tws.msserviceorders.security.AuthenticatedWorkshopService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/financial")
public class FinancialController {

    private final FinancialTransactionRepository transactionRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final ServiceOrderMapper serviceOrderMapper;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @GetMapping("/transactions")
    public Flux<FinancialTransactionResponse> listTransactions() {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMapMany(transactionRepository::findAllByWorkshopId)
                .sort(Comparator.comparing(
                        FinancialTransactionEntity::getUpdatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ).reversed())
                .map(this::toResponse);
    }

    @PostMapping("/transactions")
    public Mono<ResponseEntity<FinancialTransactionResponse>> createTransaction(
            @Valid @RequestBody FinancialTransactionRequest request
    ) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        int recurrenceMonths = resolveRecurrenceMonths(request);
        validateRecurrence(request, recurrenceMonths);

        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMapMany(workshopId -> Flux.range(0, recurrenceMonths)
                        .map(monthOffset -> toEntity(workshopId, request, now, monthOffset))
                        .flatMap(transactionRepository::save))
                .collectList()
                .map(saved -> {
                    FinancialTransactionEntity first = saved.get(0);
                    return ResponseEntity.created(URI.create("/financial/transactions/" + first.getId()))
                            .body(toResponse(first));
                });
    }

    @PutMapping("/transactions/{id}")
    public Mono<FinancialTransactionResponse> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody FinancialTransactionRequest request
    ) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> getRequired(workshopId, id)
                        .map(current -> merge(current, request, now))
                        .flatMap(transactionRepository::save))
                .map(this::toResponse);
    }

    @DeleteMapping("/transactions/{id}")
    public Mono<ResponseEntity<Void>> deleteTransaction(@PathVariable Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> getRequired(workshopId, id))
                .flatMap(transactionRepository::delete)
                .thenReturn(ResponseEntity.noContent().build());
    }

    @GetMapping("/summary")
    public Mono<FinancialSummaryResponse> summary() {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> Mono.zip(
                        transactionRepository.findAllByWorkshopId(workshopId).collectList(),
                        serviceOrderRepository.findAllByWorkshopId(workshopId).collectList()
                ))
                .map(tuple -> buildSummary(tuple.getT1(), tuple.getT2().stream()
                        .map(serviceOrderMapper::toResponse)
                        .toList()));
    }

    private Mono<FinancialTransactionEntity> getRequired(Long workshopId, Long id) {
        return transactionRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Lancamento financeiro nao encontrado.")));
    }

    private FinancialTransactionEntity toEntity(
            Long workshopId,
            FinancialTransactionRequest request,
            OffsetDateTime now,
            int recurrenceOffsetMonths
    ) {
        boolean recurringProjection = recurrenceOffsetMonths > 0;
        return FinancialTransactionEntity.builder()
                .workshopId(workshopId)
                .type(normalizeType(request.getType()))
                .status(recurringProjection ? "pending" : normalizeStatus(request.getStatus()))
                .description(normalizeText(request.getDescription()))
                .category(normalizeNullableText(request.getCategory()))
                .expenseClassification(normalizeExpenseClassification(
                        request.getExpenseClassification(),
                        request.getType()
                ))
                .paymentMethod(normalizeNullableText(request.getPaymentMethod()))
                .amount(request.getAmount())
                .dueDate(resolveDueDate(request.getDueDate(), recurrenceOffsetMonths))
                .paidAt(recurringProjection ? null : request.getPaidAt())
                .supplierId(request.getSupplierId())
                .serviceOrderId(request.getServiceOrderId())
                .notes(normalizeNullableText(request.getNotes()))
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private FinancialTransactionEntity merge(
            FinancialTransactionEntity current,
            FinancialTransactionRequest request,
            OffsetDateTime now
    ) {
        return current.toBuilder()
                .type(normalizeType(request.getType()))
                .status(normalizeStatus(request.getStatus()))
                .description(normalizeText(request.getDescription()))
                .category(normalizeNullableText(request.getCategory()))
                .expenseClassification(normalizeExpenseClassification(
                        request.getExpenseClassification(),
                        request.getType()
                ))
                .paymentMethod(normalizeNullableText(request.getPaymentMethod()))
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .paidAt(request.getPaidAt())
                .supplierId(request.getSupplierId())
                .serviceOrderId(request.getServiceOrderId())
                .notes(normalizeNullableText(request.getNotes()))
                .updatedAt(now)
                .build();
    }

    private FinancialTransactionResponse toResponse(FinancialTransactionEntity entity) {
        return FinancialTransactionResponse.builder()
                .id(entity.getId())
                .type(normalizeType(entity.getType()))
                .status(normalizeStatus(entity.getStatus()))
                .description(defaultText(entity.getDescription()))
                .category(defaultText(entity.getCategory()))
                .expenseClassification(normalizeExpenseClassification(
                        entity.getExpenseClassification(),
                        entity.getType()
                ))
                .paymentMethod(defaultText(entity.getPaymentMethod()))
                .amount(defaultMoney(entity.getAmount()))
                .dueDate(entity.getDueDate())
                .paidAt(entity.getPaidAt())
                .supplierId(entity.getSupplierId())
                .serviceOrderId(entity.getServiceOrderId())
                .notes(defaultText(entity.getNotes()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private FinancialSummaryResponse buildSummary(
            List<FinancialTransactionEntity> transactions,
            List<br.com.tws.msserviceorders.dto.response.ServiceOrderResponse> serviceOrders
    ) {
        BigDecimal serviceOrderRevenue = serviceOrders.stream()
                .filter(order -> "closed".equals(order.getStatus()) || "signed".equals(order.getStatus()))
                .map(order -> order.getTotals().getGrandTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal manualIncome = sum(transactions, "income", "paid");
        BigDecimal pendingIncome = sum(transactions, "income", "pending");
        BigDecimal paidExpenses = sum(transactions, "expense", "paid");
        BigDecimal pendingExpenses = sum(transactions, "expense", "pending");
        BigDecimal balance = serviceOrderRevenue.add(manualIncome).subtract(paidExpenses);
        BigDecimal projectedBalance = balance.add(pendingIncome).subtract(pendingExpenses);

        Map<String, BigDecimal> categories = new LinkedHashMap<>();
        transactions.stream()
                .filter(transaction -> !"canceled".equals(normalizeStatus(transaction.getStatus())))
                .forEach(transaction -> {
                    String key = normalizeType(transaction.getType()) + "::" + defaultCategory(transaction.getCategory());
                    categories.merge(key, defaultMoney(transaction.getAmount()), BigDecimal::add);
                });

        return FinancialSummaryResponse.builder()
                .serviceOrderRevenue(serviceOrderRevenue)
                .manualIncome(manualIncome)
                .pendingIncome(pendingIncome)
                .paidExpenses(paidExpenses)
                .pendingExpenses(pendingExpenses)
                .balance(balance)
                .projectedBalance(projectedBalance)
                .serviceOrders(serviceOrders.size())
                .paidTransactions((int) transactions.stream().filter(item -> "paid".equals(normalizeStatus(item.getStatus()))).count())
                .pendingTransactions((int) transactions.stream().filter(item -> "pending".equals(normalizeStatus(item.getStatus()))).count())
                .categoryTotals(categories.entrySet().stream()
                        .map(entry -> {
                            String[] parts = entry.getKey().split("::", 2);
                            return FinancialSummaryResponse.CategoryTotalResponse.builder()
                                    .type(parts[0])
                                    .category(parts[1])
                                    .amount(entry.getValue())
                                    .build();
                        })
                        .toList())
                .build();
    }

    private BigDecimal sum(List<FinancialTransactionEntity> transactions, String type, String status) {
        return transactions.stream()
                .filter(item -> type.equals(normalizeType(item.getType())))
                .filter(item -> status.equals(normalizeStatus(item.getStatus())))
                .map(item -> defaultMoney(item.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String normalizeType(String value) {
        String normalized = normalizeNullableText(value);
        if ("expense".equalsIgnoreCase(normalized) || "despesa".equalsIgnoreCase(normalized)) {
            return "expense";
        }
        if ("income".equalsIgnoreCase(normalized) || "receita".equalsIgnoreCase(normalized)) {
            return "income";
        }
        throw new BadRequestException("type deve ser income ou expense.");
    }

    private String normalizeStatus(String value) {
        String normalized = normalizeNullableText(value);
        if (
                "paid".equalsIgnoreCase(normalized) ||
                        "pago".equalsIgnoreCase(normalized) ||
                        "recebido".equalsIgnoreCase(normalized)
        ) {
            return "paid";
        }
        if ("canceled".equalsIgnoreCase(normalized) || "cancelado".equalsIgnoreCase(normalized)) {
            return "canceled";
        }
        return "pending";
    }

    private String normalizeExpenseClassification(String value, String type) {
        if (!"expense".equals(normalizeType(type))) {
            return null;
        }

        String normalized = normalizeNullableText(value);
        if (
                "fixed".equalsIgnoreCase(normalized) ||
                        "fixa".equalsIgnoreCase(normalized) ||
                        "fixo".equalsIgnoreCase(normalized)
        ) {
            return "fixed";
        }

        if (
                "variable".equalsIgnoreCase(normalized) ||
                        "variavel".equalsIgnoreCase(normalized)
        ) {
            return "variable";
        }

        return "variable";
    }

    private int resolveRecurrenceMonths(FinancialTransactionRequest request) {
        Integer recurrenceMonths = request.getRecurrenceMonths();
        return recurrenceMonths == null ? 1 : Math.max(1, recurrenceMonths);
    }

    private void validateRecurrence(FinancialTransactionRequest request, int recurrenceMonths) {
        if (recurrenceMonths <= 1) {
            return;
        }

        if (!"expense".equals(normalizeType(request.getType()))) {
            throw new BadRequestException("recurrenceMonths so pode ser usado para despesas.");
        }

        if (!"fixed".equals(normalizeExpenseClassification(request.getExpenseClassification(), request.getType()))) {
            throw new BadRequestException("Despesas recorrentes precisam ser classificadas como fixas.");
        }

        if (request.getDueDate() == null) {
            throw new BadRequestException("dueDate e obrigatoria para despesas recorrentes.");
        }
    }

    private LocalDate resolveDueDate(LocalDate dueDate, int recurrenceOffsetMonths) {
        return dueDate == null ? null : dueDate.plusMonths(recurrenceOffsetMonths);
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullableText(String value) {
        String normalized = normalizeText(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private String defaultText(String value) {
        return value == null ? "" : value;
    }

    private String defaultCategory(String value) {
        return StringUtils.hasText(value) ? value : "Sem categoria";
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
