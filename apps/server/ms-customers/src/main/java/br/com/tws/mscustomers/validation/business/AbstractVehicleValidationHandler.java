package br.com.tws.mscustomers.validation.business;

import reactor.core.publisher.Mono;

public abstract class AbstractVehicleValidationHandler {

    private AbstractVehicleValidationHandler next;

    public AbstractVehicleValidationHandler linkWith(AbstractVehicleValidationHandler nextHandler) {
        this.next = nextHandler;
        return nextHandler;
    }

    public Mono<Void> validate(VehicleValidationContext context) {
        Mono<Void> currentValidation = doValidate(context);
        return currentValidation.then(next == null ? Mono.empty() : next.validate(context));
    }

    protected abstract Mono<Void> doValidate(VehicleValidationContext context);
}
