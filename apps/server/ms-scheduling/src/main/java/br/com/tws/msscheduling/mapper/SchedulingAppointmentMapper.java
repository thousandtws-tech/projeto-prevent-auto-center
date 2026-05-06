package br.com.tws.msscheduling.mapper;

import br.com.tws.msscheduling.domain.entity.SchedulingAppointmentEntity;
import br.com.tws.msscheduling.domain.model.PageQuery;
import br.com.tws.msscheduling.domain.model.PageResult;
import br.com.tws.msscheduling.domain.model.SchedulingAppointmentSearchCriteria;
import br.com.tws.msscheduling.domain.model.SchedulingAppointmentSortField;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentCreateRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentPatchRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentSearchRequest;
import br.com.tws.msscheduling.dto.response.PageResponse;
import br.com.tws.msscheduling.dto.response.SchedulingAppointmentResponse;
import br.com.tws.msscheduling.exception.BadRequestException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class SchedulingAppointmentMapper {

    private static final String DEFAULT_STATUS = "pending";
    private static final String DEFAULT_PROVIDER = "n8n-google-calendar";
    private static final String DEFAULT_TIMEZONE = "UTC";

    public SchedulingAppointmentSearchCriteria toSearchCriteria(SchedulingAppointmentSearchRequest request) {
        return SchedulingAppointmentSearchCriteria.builder()
                .status(normalizeNullableStatus(request.getStatus()))
                .customerName(normalizeNullableText(request.getCustomerName()))
                .serviceType(normalizeNullableText(request.getServiceType()))
                .mechanicResponsible(normalizeNullableText(request.getMechanicResponsible()))
                .build();
    }

    public PageQuery toPageQuery(SchedulingAppointmentSearchRequest request) {
        String sortExpression = StringUtils.hasText(request.getSort())
                ? request.getSort().trim()
                : "startAt,asc";

        String[] tokens = sortExpression.split(",");
        if (tokens.length != 2) {
            throw new BadRequestException("Parametro sort invalido. Use o formato campo,direcao.");
        }

        SchedulingAppointmentSortField sortField = SchedulingAppointmentSortField.fromApiField(tokens[0].trim())
                .orElseThrow(() -> new BadRequestException(
                        "Campo de ordenacao invalido. Valores aceitos: id, status, customerName, serviceType, startAt, endAt, createdAt, updatedAt."
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

    public SchedulingAppointmentEntity toNewEntity(
            Long workshopId,
            SchedulingAppointmentCreateRequest request,
            OffsetDateTime now
    ) {
        OffsetDateTime startAt = normalizeDateTime(request.getStartAt(), "startAt");
        Integer durationMinutes = request.getDurationMinutes();

        return SchedulingAppointmentEntity.builder()
                .workshopId(workshopId)
                .status(DEFAULT_STATUS)
                .customerId(parseNullableId(request.getCustomerId(), "customerId"))
                .customerName(normalizeText(request.getCustomerName(), "customerName"))
                .customerPhone(normalizeText(request.getCustomerPhone(), "customerPhone"))
                .customerEmail(normalizeNullableText(request.getCustomerEmail()))
                .vehicleModel(normalizeText(request.getVehicleModel(), "vehicleModel"))
                .vehiclePlate(normalizeNullableText(request.getVehiclePlate()))
                .serviceType(normalizeText(request.getServiceType(), "serviceType"))
                .mechanicResponsible(normalizeNullableText(request.getMechanicResponsible()))
                .notes(normalizeNullableText(request.getNotes()))
                .startAt(startAt)
                .endAt(startAt.plusMinutes(durationMinutes))
                .durationMinutes(durationMinutes)
                .timezone(normalizeTimezone(request.getTimezone()))
                .integrationProvider(DEFAULT_PROVIDER)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public SchedulingAppointmentEntity merge(
            SchedulingAppointmentEntity current,
            SchedulingAppointmentPatchRequest request,
            OffsetDateTime now
    ) {
        SchedulingAppointmentPatchRequest.CustomerPatchRequest customer = request.getCustomer();
        SchedulingAppointmentPatchRequest.VehiclePatchRequest vehicle = request.getVehicle();
        SchedulingAppointmentPatchRequest.SchedulePatchRequest schedule = request.getSchedule();
        SchedulingAppointmentPatchRequest.IntegrationPatchRequest integration = request.getIntegration();
        SchedulingAppointmentPatchRequest.ServiceOrderPatchRequest serviceOrder = request.getServiceOrder();

        OffsetDateTime startAt = current.getStartAt();
        if (schedule != null && schedule.getStartAt() != null) {
            startAt = normalizeDateTime(schedule.getStartAt(), "schedule.startAt");
        }

        Integer durationMinutes = current.getDurationMinutes();
        if (schedule != null && schedule.getDurationMinutes() != null) {
            durationMinutes = schedule.getDurationMinutes();
        }

        OffsetDateTime endAt = current.getEndAt();
        if (schedule != null && schedule.getEndAt() != null) {
            endAt = normalizeDateTime(schedule.getEndAt(), "schedule.endAt");
        } else if (schedule != null && (schedule.getStartAt() != null || schedule.getDurationMinutes() != null)) {
            endAt = startAt.plusMinutes(durationMinutes);
        }

        return current.toBuilder()
                .status(request.getStatus() != null ? normalizeStatus(request.getStatus()) : current.getStatus())
                .mechanicResponsible(request.getMechanicResponsible() != null
                        ? normalizeNullableText(request.getMechanicResponsible())
                        : current.getMechanicResponsible())
                .customerId(customer != null ? parseNullableId(customer.getId(), "customer.id") : current.getCustomerId())
                .customerName(customer != null
                        ? mergeRequiredText(customer.getName(), current.getCustomerName(), "customer.name")
                        : current.getCustomerName())
                .customerPhone(customer != null
                        ? mergeRequiredText(customer.getPhone(), current.getCustomerPhone(), "customer.phone")
                        : current.getCustomerPhone())
                .customerEmail(customer != null ? normalizeNullableText(customer.getEmail()) : current.getCustomerEmail())
                .vehicleModel(vehicle != null
                        ? mergeRequiredText(vehicle.getModel(), current.getVehicleModel(), "vehicle.model")
                        : current.getVehicleModel())
                .vehiclePlate(vehicle != null ? normalizeNullableText(vehicle.getPlate()) : current.getVehiclePlate())
                .serviceType(schedule != null
                        ? mergeRequiredText(schedule.getServiceType(), current.getServiceType(), "schedule.serviceType")
                        : current.getServiceType())
                .notes(schedule != null
                        ? (schedule.getNotes() != null ? normalizeNullableText(schedule.getNotes()) : current.getNotes())
                        : current.getNotes())
                .startAt(startAt)
                .endAt(endAt)
                .durationMinutes(durationMinutes)
                .timezone(schedule != null
                        ? (schedule.getTimezone() != null ? normalizeTimezone(schedule.getTimezone()) : current.getTimezone())
                        : current.getTimezone())
                .integrationProvider(integration != null
                        ? normalizeProvider(integration.getProvider() != null ? integration.getProvider() : current.getIntegrationProvider())
                        : current.getIntegrationProvider())
                .integrationLastAttemptAt(integration != null
                        ? (integration.getLastAttemptAt() != null
                        ? normalizeDateTime(integration.getLastAttemptAt(), "integration.lastAttemptAt")
                        : current.getIntegrationLastAttemptAt())
                        : current.getIntegrationLastAttemptAt())
                .integrationLastError(integration != null
                        ? integration.getLastError()
                        : current.getIntegrationLastError())
                .integrationEventId(integration != null
                        ? (integration.getEventId() != null ? normalizeNullableText(integration.getEventId()) : current.getIntegrationEventId())
                        : current.getIntegrationEventId())
                .integrationEventLink(integration != null
                        ? (integration.getEventLink() != null ? normalizeNullableText(integration.getEventLink()) : current.getIntegrationEventLink())
                        : current.getIntegrationEventLink())
                .integrationResponseMessage(integration != null
                        ? integration.getResponseMessage()
                        : current.getIntegrationResponseMessage())
                .serviceOrderId(serviceOrder != null
                        ? parseNullableId(serviceOrder.getId(), "serviceOrder.id")
                        : current.getServiceOrderId())
                .serviceOrderNumber(serviceOrder != null
                        ? normalizeNullableText(serviceOrder.getOrderNumber())
                        : current.getServiceOrderNumber())
                .updatedAt(now)
                .build();
    }

    public SchedulingAppointmentResponse toResponse(SchedulingAppointmentEntity entity) {
        return SchedulingAppointmentResponse.builder()
                .id(entity.getId() == null ? null : entity.getId().toString())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .status(normalizeStatus(entity.getStatus()))
                .mechanicResponsible(defaultText(entity.getMechanicResponsible()))
                .customer(SchedulingAppointmentResponse.CustomerResponse.builder()
                        .id(entity.getCustomerId() == null ? null : entity.getCustomerId().toString())
                        .name(defaultText(entity.getCustomerName()))
                        .phone(defaultText(entity.getCustomerPhone()))
                        .email(defaultText(entity.getCustomerEmail()))
                        .build())
                .vehicle(SchedulingAppointmentResponse.VehicleResponse.builder()
                        .model(defaultText(entity.getVehicleModel()))
                        .plate(defaultText(entity.getVehiclePlate()))
                        .build())
                .schedule(SchedulingAppointmentResponse.ScheduleResponse.builder()
                        .serviceType(defaultText(entity.getServiceType()))
                        .notes(defaultText(entity.getNotes()))
                        .startAt(entity.getStartAt())
                        .endAt(entity.getEndAt())
                        .durationMinutes(entity.getDurationMinutes())
                        .timezone(defaultText(entity.getTimezone()))
                        .build())
                .integration(SchedulingAppointmentResponse.IntegrationResponse.builder()
                        .provider(normalizeProvider(entity.getIntegrationProvider()))
                        .lastAttemptAt(entity.getIntegrationLastAttemptAt())
                        .lastError(entity.getIntegrationLastError())
                        .eventId(entity.getIntegrationEventId())
                        .eventLink(entity.getIntegrationEventLink())
                        .responseMessage(entity.getIntegrationResponseMessage())
                        .build())
                .serviceOrder(SchedulingAppointmentResponse.ServiceOrderResponse.builder()
                        .id(entity.getServiceOrderId() == null ? null : entity.getServiceOrderId().toString())
                        .orderNumber(defaultText(entity.getServiceOrderNumber()))
                        .build())
                .build();
    }

    public PageResponse<SchedulingAppointmentResponse> toPageResponse(PageResult<SchedulingAppointmentEntity> result) {
        int totalPages = result.totalElements() == 0
                ? 0
                : (int) Math.ceil((double) result.totalElements() / result.pageQuery().size());

        return PageResponse.<SchedulingAppointmentResponse>builder()
                .content(result.content().stream().map(this::toResponse).toList())
                .page(result.pageQuery().page())
                .size(result.pageQuery().size())
                .totalElements(result.totalElements())
                .totalPages(totalPages)
                .sort(result.pageQuery().sortExpression())
                .build();
    }

    private OffsetDateTime normalizeDateTime(OffsetDateTime value, String fieldName) {
        if (value == null) {
            throw new BadRequestException(fieldName + " e obrigatorio.");
        }
        return value.withOffsetSameInstant(ZoneOffset.UTC);
    }

    private String mergeRequiredText(String patchValue, String currentValue, String fieldName) {
        if (patchValue == null) {
            return currentValue;
        }
        return normalizeText(patchValue, fieldName);
    }

    private String normalizeText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new BadRequestException(fieldName + " e obrigatorio.");
        }
        return value.trim();
    }

    private String normalizeNullableText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String normalizeTimezone(String value) {
        String normalized = normalizeNullableText(value);
        return normalized != null ? normalized : DEFAULT_TIMEZONE;
    }

    private String normalizeNullableStatus(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return normalizeStatus(value);
    }

    private String normalizeStatus(String value) {
        String normalized = normalizeNullableText(value);
        if (normalized == null) {
            return DEFAULT_STATUS;
        }

        return switch (normalized.toLowerCase()) {
            case "pending", "confirmed", "failed", "canceled" -> normalized.toLowerCase();
            default -> throw new BadRequestException(
                    "Status invalido. Valores aceitos: pending, confirmed, failed, canceled."
            );
        };
    }

    private String normalizeProvider(String value) {
        String normalized = normalizeNullableText(value);
        if (normalized == null) {
            return DEFAULT_PROVIDER;
        }

        if (!DEFAULT_PROVIDER.equalsIgnoreCase(normalized)) {
            throw new BadRequestException("integration.provider invalido. Valor aceito: n8n-google-calendar.");
        }

        return DEFAULT_PROVIDER;
    }

    private Long parseNullableId(String value, String fieldName) {
        String normalized = normalizeNullableText(value);
        if (normalized == null) {
            return null;
        }

        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException exception) {
            throw new BadRequestException(fieldName + " deve ser numerico.");
        }
    }

    private String defaultText(String value) {
        return value == null ? "" : value;
    }
}
