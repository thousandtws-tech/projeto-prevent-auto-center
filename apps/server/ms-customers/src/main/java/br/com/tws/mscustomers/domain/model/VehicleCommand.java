package br.com.tws.mscustomers.domain.model;

import lombok.Builder;

@Builder
public record VehicleCommand(
        String modelo,
        String brand,
        String plate,
        String chassiNumber,
        Long mileage,
        Long year,
        String color
) {
}
