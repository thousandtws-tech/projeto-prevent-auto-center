package br.com.tws.msserviceorders.mapper;

import br.com.tws.msserviceorders.domain.entity.ServiceOrderEntity;
import br.com.tws.msserviceorders.domain.model.PageQuery;
import br.com.tws.msserviceorders.domain.model.PageResult;
import br.com.tws.msserviceorders.domain.model.ServiceOrderSearchCriteria;
import br.com.tws.msserviceorders.domain.model.ServiceOrderSortField;
import br.com.tws.msserviceorders.domain.model.StoredServiceOrderPayload;
import br.com.tws.msserviceorders.dto.request.ServiceOrderSearchRequest;
import br.com.tws.msserviceorders.dto.request.ServiceOrderUpsertRequest;
import br.com.tws.msserviceorders.dto.request.SignSharedServiceOrderRequest;
import br.com.tws.msserviceorders.dto.response.PageResponse;
import br.com.tws.msserviceorders.dto.response.ServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.ShareServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.SharedServiceOrderResponse;
import br.com.tws.msserviceorders.exception.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class ServiceOrderMapper {

    private final ObjectMapper objectMapper;

    public ServiceOrderSearchCriteria toSearchCriteria(ServiceOrderSearchRequest request) {
        return ServiceOrderSearchCriteria.builder()
                .status(normalizeNullableText(request.getStatus()))
                .orderNumber(normalizeNullableText(request.getOrderNumber()))
                .customerName(normalizeNullableText(request.getCustomerName()))
                .signatureStatus(normalizeNullableText(request.getSignatureStatus()))
                .build();
    }

    public PageQuery toPageQuery(ServiceOrderSearchRequest request) {
        String sortExpression = StringUtils.hasText(request.getSort())
                ? request.getSort().trim()
                : "createdAt,desc";

        String[] tokens = sortExpression.split(",");
        if (tokens.length != 2) {
            throw new BadRequestException("Parametro sort invalido. Use o formato campo,direcao.");
        }

        ServiceOrderSortField sortField = ServiceOrderSortField.fromApiField(tokens[0].trim())
                .orElseThrow(() -> new BadRequestException(
                        "Campo de ordenacao invalido. Valores aceitos: id, orderNumber, customerName, status, createdAt, updatedAt."
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

    public ServiceOrderEntity toNewEntity(Long workshopId, ServiceOrderUpsertRequest request, OffsetDateTime now) {
        return ServiceOrderEntity.builder()
                .workshopId(workshopId)
                .status(normalizeRecordStatus(request.getStatus(), request.getSignature()))
                .orderNumber(normalizeText(request.getOrderInfo().getOrderNumber()))
                .customerName(normalizeText(request.getOrderInfo().getCustomerName()))
                .payloadJson(writePayload(toStoredPayload(request)))
                .signatureToken(normalizeNullableText(request.getSignature() != null ? request.getSignature().getToken() : null))
                .signatureLink(normalizeNullableText(request.getSignature() != null ? request.getSignature().getLink() : null))
                .signatureStatus(normalizeSignatureStatus(request.getSignature() != null ? request.getSignature().getStatus() : null))
                .signerName(normalizeNullableText(request.getSignature() != null ? request.getSignature().getSignerName() : null))
                .signedAt(parseOffsetDateTime(request.getSignature() != null ? request.getSignature().getSignedAt() : null))
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public ServiceOrderEntity merge(ServiceOrderEntity current, ServiceOrderUpsertRequest request, OffsetDateTime now) {
        return current.toBuilder()
                .status(normalizeRecordStatus(request.getStatus(), request.getSignature()))
                .orderNumber(normalizeText(request.getOrderInfo().getOrderNumber()))
                .customerName(normalizeText(request.getOrderInfo().getCustomerName()))
                .payloadJson(writePayload(toStoredPayload(request)))
                .signatureToken(normalizeNullableText(request.getSignature() != null ? request.getSignature().getToken() : null))
                .signatureLink(normalizeNullableText(request.getSignature() != null ? request.getSignature().getLink() : null))
                .signatureStatus(normalizeSignatureStatus(request.getSignature() != null ? request.getSignature().getStatus() : null))
                .signerName(normalizeNullableText(request.getSignature() != null ? request.getSignature().getSignerName() : null))
                .signedAt(parseOffsetDateTime(request.getSignature() != null ? request.getSignature().getSignedAt() : null))
                .updatedAt(now)
                .build();
    }

    public ServiceOrderEntity share(ServiceOrderEntity current, String token, String link, OffsetDateTime now) {
        return current.toBuilder()
                .status(isFinalStatus(current.getStatus()) ? normalizeStatus(current.getStatus()) : "sent_for_signature")
                .signatureToken(token)
                .signatureLink(link)
                .signatureStatus("signed".equals(normalizeSignatureStatus(current.getSignatureStatus())) ? "signed" : "pending")
                .updatedAt(now)
                .build();
    }

    public ServiceOrderEntity sign(ServiceOrderEntity current, SignSharedServiceOrderRequest request, OffsetDateTime now) {
        StoredServiceOrderPayload currentPayload = readPayload(current.getPayloadJson());

        StoredServiceOrderPayload nextPayload = StoredServiceOrderPayload.builder()
                .orderInfo(currentPayload.getOrderInfo())
                .checklist(currentPayload.getChecklist())
                .parts(request.getParts() != null ? toStoredParts(request.getParts()) : currentPayload.getParts())
                .laborServices(request.getLaborServices() != null ? toStoredServices(request.getLaborServices()) : currentPayload.getLaborServices())
                .thirdPartyServices(request.getThirdPartyServices() != null ? toStoredServices(request.getThirdPartyServices()) : currentPayload.getThirdPartyServices())
                .discount(defaultDecimal(currentPayload.getDiscount()))
                .totals(request.getTotals() != null ? toStoredTotals(request.getTotals()) : currentPayload.getTotals())
                .build();

        return current.toBuilder()
                .status("signed")
                .payloadJson(writePayload(nextPayload))
                .signatureStatus("signed")
                .signerName(normalizeText(request.getSignerName()))
                .signedAt(now)
                .updatedAt(now)
                .build();
    }

    public ServiceOrderEntity reopenShared(ServiceOrderEntity current, OffsetDateTime now) {
        return current.toBuilder()
                .status("sent_for_signature")
                .signatureStatus("pending")
                .signerName(null)
                .signedAt(null)
                .updatedAt(now)
                .build();
    }

    public ServiceOrderResponse toResponse(ServiceOrderEntity entity) {
        StoredServiceOrderPayload payload = readPayload(entity.getPayloadJson());

        return ServiceOrderResponse.builder()
                .id(entity.getId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .status(normalizeStatus(entity.getStatus()))
                .orderInfo(toOrderInfoResponse(payload.getOrderInfo()))
                .checklist(payload.getChecklist() == null ? Map.of() : payload.getChecklist())
                .parts(toPartResponses(payload.getParts()))
                .laborServices(toServiceResponses(payload.getLaborServices()))
                .thirdPartyServices(toServiceResponses(payload.getThirdPartyServices()))
                .discount(defaultDecimal(payload.getDiscount()))
                .totals(toTotalsResponse(payload.getTotals()))
                .signature(toSignatureResponse(entity))
                .build();
    }

    public SharedServiceOrderResponse toSharedResponse(ServiceOrderEntity entity) {
        StoredServiceOrderPayload payload = readPayload(entity.getPayloadJson());

        return SharedServiceOrderResponse.builder()
                .token(entity.getSignatureToken())
                .createdAt(entity.getCreatedAt())
                .status("signed".equals(normalizeSignatureStatus(entity.getSignatureStatus())) ? "signed" : "pending")
                .orderInfo(toOrderInfoResponse(payload.getOrderInfo()))
                .checklist(payload.getChecklist() == null ? Map.of() : payload.getChecklist())
                .parts(toPartResponses(payload.getParts()))
                .laborServices(toServiceResponses(payload.getLaborServices()))
                .thirdPartyServices(toServiceResponses(payload.getThirdPartyServices()))
                .discount(defaultDecimal(payload.getDiscount()))
                .totals(toTotalsResponse(payload.getTotals()))
                .signature(entity.getSignedAt() == null ? null : SharedServiceOrderResponse.SignatureResponse.builder()
                        .name(entity.getSignerName())
                        .signedAt(entity.getSignedAt().toString())
                        .build())
                .build();
    }

    public ShareServiceOrderResponse toShareResponse(ServiceOrderEntity entity) {
        return ShareServiceOrderResponse.builder()
                .serviceOrderId(entity.getId())
                .token(entity.getSignatureToken())
                .link(entity.getSignatureLink())
                .status(normalizeSignatureStatus(entity.getSignatureStatus()))
                .build();
    }

    public PageResponse<ServiceOrderResponse> toPageResponse(PageResult<ServiceOrderEntity> result) {
        int totalPages = result.getTotalElements() == 0
                ? 0
                : (int) Math.ceil((double) result.getTotalElements() / result.getPageQuery().size());

        return PageResponse.<ServiceOrderResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getPageQuery().page())
                .size(result.getPageQuery().size())
                .totalElements(result.getTotalElements())
                .totalPages(totalPages)
                .sort(result.getPageQuery().sortExpression())
                .build();
    }

    private StoredServiceOrderPayload toStoredPayload(ServiceOrderUpsertRequest request) {
        return StoredServiceOrderPayload.builder()
                .orderInfo(StoredServiceOrderPayload.OrderInfo.builder()
                        .orderNumber(normalizeText(request.getOrderInfo().getOrderNumber()))
                        .date(normalizeText(request.getOrderInfo().getDate()))
                        .customerName(normalizeText(request.getOrderInfo().getCustomerName()))
                        .phone(normalizeNullableText(request.getOrderInfo().getPhone()))
                        .vehicle(normalizeNullableText(request.getOrderInfo().getVehicle()))
                        .year(normalizeNullableText(request.getOrderInfo().getYear()))
                        .plate(normalizeNullableText(request.getOrderInfo().getPlate()))
                        .km(normalizeNullableText(request.getOrderInfo().getKm()))
                        .mechanicResponsible(normalizeNullableText(request.getOrderInfo().getMechanicResponsible()))
                        .paymentMethod(normalizeNullableText(request.getOrderInfo().getPaymentMethod()))
                        .notes(normalizeNullableText(request.getOrderInfo().getNotes()))
                        .build())
                .checklist(request.getChecklist() == null ? Map.of() : request.getChecklist())
                .parts(toStoredParts(request.getParts()))
                .laborServices(toStoredServices(request.getLaborServices()))
                .thirdPartyServices(toStoredServices(request.getThirdPartyServices()))
                .discount(defaultDecimal(request.getDiscount()))
                .totals(toStoredTotals(request.getTotals()))
                .build();
    }

    private List<StoredServiceOrderPayload.PartItem> toStoredParts(List<ServiceOrderUpsertRequest.PartRequest> parts) {
        if (parts == null) {
            return List.of();
        }

        return parts.stream()
                .map(part -> StoredServiceOrderPayload.PartItem.builder()
                        .id(normalizeText(part.getId()))
                        .catalogItemId(normalizeNullableText(part.getCatalogItemId()))
                        .partCondition(normalizePartCondition(part.getPartCondition()))
                        .description(normalizeText(part.getDescription()))
                        .quantity(part.getQuantity())
                        .unitPrice(defaultDecimal(part.getUnitPrice()))
                        .status(normalizeDecisionStatus(part.getStatus()))
                        .build())
                .toList();
    }

    private List<StoredServiceOrderPayload.ServiceItem> toStoredServices(List<ServiceOrderUpsertRequest.ServiceItemRequest> services) {
        if (services == null) {
            return List.of();
        }

        return services.stream()
                .map(service -> StoredServiceOrderPayload.ServiceItem.builder()
                        .id(normalizeText(service.getId()))
                        .catalogItemId(normalizeNullableText(service.getCatalogItemId()))
                        .description(normalizeText(service.getDescription()))
                        .amount(defaultDecimal(service.getAmount()))
                        .costPrice(defaultDecimal(service.getCostPrice()))
                        .profitAmount(defaultDecimal(service.getProfitAmount()))
                        .status(normalizeDecisionStatus(service.getStatus()))
                        .build())
                .toList();
    }

    private StoredServiceOrderPayload.Totals toStoredTotals(ServiceOrderUpsertRequest.TotalsRequest totals) {
        return StoredServiceOrderPayload.Totals.builder()
                .partsSubtotal(defaultDecimal(totals.getPartsSubtotal()))
                .laborSubtotal(defaultDecimal(totals.getLaborSubtotal()))
                .thirdPartySubtotal(defaultDecimal(totals.getThirdPartySubtotal()))
                .grandTotal(defaultDecimal(totals.getGrandTotal()))
                .build();
    }

    private StoredServiceOrderPayload readPayload(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson, StoredServiceOrderPayload.class);
        } catch (Exception exception) {
            throw new BadRequestException("Falha ao interpretar o payload da ordem de servico persistida.");
        }
    }

    private String writePayload(StoredServiceOrderPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new BadRequestException("Falha ao serializar o payload da ordem de servico.");
        }
    }

    private ServiceOrderResponse.OrderInfoResponse toOrderInfoResponse(StoredServiceOrderPayload.OrderInfo orderInfo) {
        StoredServiceOrderPayload.OrderInfo resolved = orderInfo != null
                ? orderInfo
                : StoredServiceOrderPayload.OrderInfo.builder()
                        .orderNumber("")
                        .date("")
                        .customerName("")
                        .build();

        return ServiceOrderResponse.OrderInfoResponse.builder()
                .orderNumber(resolved.getOrderNumber())
                .date(resolved.getDate())
                .customerName(resolved.getCustomerName())
                .phone(resolved.getPhone())
                .vehicle(resolved.getVehicle())
                .year(resolved.getYear())
                .plate(resolved.getPlate())
                .km(resolved.getKm())
                .mechanicResponsible(resolved.getMechanicResponsible())
                .paymentMethod(resolved.getPaymentMethod())
                .notes(resolved.getNotes())
                .build();
    }

    private List<ServiceOrderResponse.PartResponse> toPartResponses(List<StoredServiceOrderPayload.PartItem> parts) {
        if (parts == null) {
            return List.of();
        }

        return parts.stream()
                .map(part -> ServiceOrderResponse.PartResponse.builder()
                        .id(part.getId())
                        .catalogItemId(part.getCatalogItemId())
                        .partCondition(normalizePartCondition(part.getPartCondition()))
                        .description(part.getDescription())
                        .quantity(part.getQuantity())
                        .unitPrice(defaultDecimal(part.getUnitPrice()))
                        .status(normalizeDecisionStatus(part.getStatus()))
                        .build())
                .toList();
    }

    private List<ServiceOrderResponse.ServiceItemResponse> toServiceResponses(List<StoredServiceOrderPayload.ServiceItem> services) {
        if (services == null) {
            return List.of();
        }

        return services.stream()
                .map(service -> ServiceOrderResponse.ServiceItemResponse.builder()
                        .id(service.getId())
                        .catalogItemId(service.getCatalogItemId())
                        .description(service.getDescription())
                        .amount(defaultDecimal(service.getAmount()))
                        .costPrice(defaultDecimal(service.getCostPrice()))
                        .profitAmount(defaultDecimal(service.getProfitAmount()))
                        .status(normalizeDecisionStatus(service.getStatus()))
                        .build())
                .toList();
    }

    private ServiceOrderResponse.TotalsResponse toTotalsResponse(StoredServiceOrderPayload.Totals totals) {
        return ServiceOrderResponse.TotalsResponse.builder()
                .partsSubtotal(defaultDecimal(totals != null ? totals.getPartsSubtotal() : null))
                .laborSubtotal(defaultDecimal(totals != null ? totals.getLaborSubtotal() : null))
                .thirdPartySubtotal(defaultDecimal(totals != null ? totals.getThirdPartySubtotal() : null))
                .grandTotal(defaultDecimal(totals != null ? totals.getGrandTotal() : null))
                .build();
    }

    private ServiceOrderResponse.SignatureResponse toSignatureResponse(ServiceOrderEntity entity) {
        if (!StringUtils.hasText(entity.getSignatureToken()) || !StringUtils.hasText(entity.getSignatureLink())) {
            return null;
        }

        return ServiceOrderResponse.SignatureResponse.builder()
                .token(entity.getSignatureToken())
                .link(entity.getSignatureLink())
                .status(normalizeSignatureStatus(entity.getSignatureStatus()))
                .signerName(entity.getSignerName())
                .signedAt(entity.getSignedAt() != null ? entity.getSignedAt().toString() : null)
                .build();
    }

    private String normalizePartCondition(String value) {
        if (!StringUtils.hasText(value) || "new".equalsIgnoreCase(value)) {
            return "new";
        }

        if ("used".equalsIgnoreCase(value)) {
            return "used";
        }

        return "new";
    }

    private OffsetDateTime parseOffsetDateTime(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        try {
            return OffsetDateTime.parse(value.trim());
        } catch (Exception exception) {
            throw new BadRequestException("Data de assinatura invalida.");
        }
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
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

    private String normalizeDecisionStatus(String value) {
        return "declined".equalsIgnoreCase(normalizeNullableText(value)) ? "declined" : "approved";
    }

    private String normalizeSignatureStatus(String value) {
        return "signed".equalsIgnoreCase(normalizeNullableText(value)) ? "signed" : "pending";
    }

    private String normalizeStatus(String value) {
        if ("signed".equalsIgnoreCase(normalizeNullableText(value))) {
            return "signed";
        }

        if ("closed".equalsIgnoreCase(normalizeNullableText(value))) {
            return "closed";
        }

        if ("sent_for_signature".equalsIgnoreCase(normalizeNullableText(value))) {
            return "sent_for_signature";
        }

        return "registered";
    }

    private String normalizeRecordStatus(String value, ServiceOrderUpsertRequest.SignatureRequest signature) {
        if ("signed".equalsIgnoreCase(normalizeNullableText(value))) {
            return "signed";
        }

        if ("closed".equalsIgnoreCase(normalizeNullableText(value))) {
            return "closed";
        }

        if ("sent_for_signature".equalsIgnoreCase(normalizeNullableText(value))) {
            return "sent_for_signature";
        }

        if ("registered".equalsIgnoreCase(normalizeNullableText(value))) {
            return "registered";
        }

        if (StringUtils.hasText(normalizeNullableText(value))) {
            throw new BadRequestException("status invalido. Valores aceitos: registered, sent_for_signature, closed, signed.");
        }

        return signature != null && StringUtils.hasText(signature.getToken())
                ? "sent_for_signature"
                : "registered";
    }

    private boolean isFinalStatus(String value) {
        String normalized = normalizeStatus(value);
        return "closed".equals(normalized) || "signed".equals(normalized);
    }
}
