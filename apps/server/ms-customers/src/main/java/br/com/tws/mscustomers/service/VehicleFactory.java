package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.domain.model.VehicleCommand;
import org.springframework.stereotype.Component;

@Component
public class VehicleFactory {

    public VehicleEntity create(Long workshopId, VehicleCommand command) {
        return VehicleEntity.builder()
                .workshopId(workshopId)
                .model(command.modelo())
                .brand(command.brand())
                .plate(command.plate())
                .chassisNumber(command.chassiNumber())
                .mileage(command.mileage())
                .year(command.year())
                .color(command.color())
                .build();
    }

    public VehicleEntity update(VehicleEntity existing, VehicleCommand command) {
        return existing.toBuilder()
                .model(command.modelo())
                .brand(command.brand())
                .plate(command.plate())
                .chassisNumber(command.chassiNumber())
                .mileage(command.mileage())
                .year(command.year())
                .color(command.color())
                .build();
    }
}
