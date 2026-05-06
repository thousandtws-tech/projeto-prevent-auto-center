package br.com.tws.mscustomers.validation.business;

import br.com.tws.mscustomers.domain.model.VehicleCommand;

public record VehicleValidationContext(Long workshopId, VehicleCommand command, Long currentVehicleId) {
}
