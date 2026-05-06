package br.com.tws.mscustomers.mapper;

import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.domain.model.*;
import br.com.tws.mscustomers.dto.request.VehicleCreateRequest;
import br.com.tws.mscustomers.dto.request.VehicleSearchRequest;
import br.com.tws.mscustomers.dto.request.VehicleUpdateRequest;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.dto.response.VehicleResponse;
import br.com.tws.mscustomers.exception.BadRequestException;
import br.com.tws.mscustomers.validation.util.TextUtils;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Objects;

@Component
public class VehicleMapper {

    public VehicleCommand toCommand(VehicleCreateRequest request) {
        return toCommand(
                request.getModel(),
                request.getBrand(),
                request.getPlate(),
                request.getChassisNumber(),
                request.getMileage(),
                request.getYear(),
                request.getColor()
        );
    }

    public VehicleCommand toCommand(VehicleUpdateRequest request) {
        return toCommand(
                request.getModel(),
                request.getBrand(),
                request.getPlate(),
                request.getChassisNumber(),
                request.getMileage(),
                request.getYear(),
                request.getColor()
        );
    }

    public VehicleSearchCriteria toSearchCriteria(VehicleSearchRequest request) {
        return VehicleSearchCriteria.builder()
                .modelo(normalizeNullableText(request.getModelo()))
                .brand(normalizeNullableText(request.getBrand()))
                .plate(normalizeNullableText(request.getPlate()))
                .chassiNumber(normalizeNullableText(request.getChassiNumber()))
                .mileage(request.getMileage())
                .year(request.getYear())
                .color(normalizeNullableText(request.getColor()))
                .build();
    }

    @SuppressWarnings("null")
    public PageQuery toPageQuery(VehicleSearchRequest request) {
        String sortExpression = StringUtils.hasText(request.getSort())
                ? request.getSort().trim()
                : "id,asc";

        String[] tokens = sortExpression.split(",");
        if (tokens.length != 2) {
            throw new BadRequestException("Parametro sort invalido. Use o formato campo,direcao.");
        }

        VehicleSortField sortField = VehicleSortField.fromApiField(tokens[0].trim())
                .orElseThrow(() -> new BadRequestException(
                        "Campo de ordenacao invalido. Valores aceitos: id, modelo, brand, plate, chassiNumber, mileage, year, color."
                ));

        String directionStr = Objects.requireNonNullElse(
                tokens.length > 1 ? tokens[1].trim() : null, "");
        Sort.Direction direction = Sort.Direction.fromOptionalString(directionStr)
                .orElseThrow(() -> new BadRequestException("Direcao de ordenacao invalida. Use asc ou desc."));

        return PageQuery.builder()
                .page(request.getPage())
                .size(request.getSize())
                .sortField(sortField)
                .direction(direction)
                .build();
    }

    public VehicleResponse toResponse(VehicleEntity entity) {
        return VehicleResponse.builder()
                .id(entity.getId())
                .modelo(entity.getModel())
                .brand(entity.getBrand())
                .plate(entity.getPlate())
                .chassiNumber(entity.getChassisNumber())
                .mileage(entity.getMileage())
                .year(entity.getYear())
                .color(entity.getColor())
                .build();
    }

    public PageResponse<VehicleResponse> toPageResponse(PageResult<VehicleEntity> result) {
        int totalPages = result.getTotalElements() == 0
                ? 0
                : (int) Math.ceil((double) result.getTotalElements() / result.getPageQuery().size());

        return PageResponse.<VehicleResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getPageQuery().page())
                .size(result.getPageQuery().size())
                .totalElements(result.getTotalElements())
                .totalPages(totalPages)
                .sort(result.getPageQuery().sortExpression())
                .build();
    }

    private VehicleCommand toCommand(String model, String brand, String plate, String chassisNumber,
                                     Long mileage, Long year, String color) {
        return VehicleCommand.builder()
                .modelo(TextUtils.normalizeWhitespace(model))
                .brand(TextUtils.normalizeWhitespace(brand))
                .plate(normalizePlate(plate))
                .chassiNumber(TextUtils.normalizeWhitespace(chassisNumber))
                .mileage(mileage)
                .year(year)
                .color(color != null ? TextUtils.normalizeWhitespace(color) : null)
                .build();
    }

    private String normalizePlate(String plate) {
        return StringUtils.hasText(plate) ? plate.trim().toUpperCase() : null;
    }

    private String normalizeNullableText(String value) {
        return StringUtils.hasText(value) ? TextUtils.normalizeWhitespace(value) : null;
    }
}
