package br.com.tws.mscustomers.validation.business;

import br.com.tws.mscustomers.exception.DuplicateVehicleFieldException;
import br.com.tws.mscustomers.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class DuplicateChassisNumberValidationHandler extends AbstractVehicleValidationHandler {

    private final VehicleRepository vehicleRepository;

    @Override
    protected Mono<Void> doValidate(VehicleValidationContext context) {
        Mono<Boolean> existsMono = context.currentVehicleId() == null
                ? vehicleRepository.existsByWorkshopIdAndChassisNumber(context.workshopId(), context.command().chassiNumber())
                : vehicleRepository.existsByWorkshopIdAndChassisNumberAndIdNot(
                        context.workshopId(),
                        context.command().chassiNumber(),
                        context.currentVehicleId()
                );

        return existsMono.flatMap(exists -> exists
                ? Mono.error(new DuplicateVehicleFieldException("chassiNumber", context.command().chassiNumber()))
                : Mono.empty());
    }
}
