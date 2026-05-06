package br.com.tws.mscustomers.validation.business;

import lombok.Getter;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Getter
@Component
public class VehicleValidationChain {

    private final AbstractVehicleValidationHandler firstHandler;

    public VehicleValidationChain(
            DuplicatePlateValidationHandler duplicatePlateValidationHandler,
            DuplicateChassisNumberValidationHandler duplicateChassisNumberValidationHandler
    ) {
        duplicatePlateValidationHandler.linkWith(duplicateChassisNumberValidationHandler);
        this.firstHandler = duplicatePlateValidationHandler;
    }

    public Mono<Void> validate(VehicleValidationContext context) {
        return firstHandler.validate(context);
    }
}
