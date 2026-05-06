package br.com.tws.mscustomers.validation.business;

import br.com.tws.mscustomers.exception.DuplicateVehicleFieldException;
import br.com.tws.mscustomers.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class DuplicatePlateValidationHandler extends AbstractVehicleValidationHandler {

    private final VehicleRepository vehicleRepository;

    @Override
    protected Mono<Void> doValidate(VehicleValidationContext context) {
        Mono<Boolean> existsMono = context.currentVehicleId() == null
                ? vehicleRepository.existsByWorkshopIdAndPlate(context.workshopId(), context.command().plate())
                : vehicleRepository.existsByWorkshopIdAndPlateAndIdNot(
                        context.workshopId(),
                        context.command().plate(),
                        context.currentVehicleId()
                );

        return existsMono.flatMap(exists -> exists
                ? Mono.error(new DuplicateVehicleFieldException("plate", context.command().plate()))
                : Mono.empty());
    }
}
