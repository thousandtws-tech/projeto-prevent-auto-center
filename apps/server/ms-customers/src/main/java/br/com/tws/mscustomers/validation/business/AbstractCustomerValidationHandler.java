package br.com.tws.mscustomers.validation.business;

import reactor.core.publisher.Mono;

public abstract class AbstractCustomerValidationHandler {

    private AbstractCustomerValidationHandler next;

    public AbstractCustomerValidationHandler linkWith(AbstractCustomerValidationHandler nextHandler) {
        this.next = nextHandler;
        return nextHandler;
    }

    public Mono<Void> validate(CustomerValidationContext context) {
        Mono<Void> currentValidation = doValidate(context);
        return currentValidation.then(next == null ? Mono.empty() : next.validate(context));
    }

    protected abstract Mono<Void> doValidate(CustomerValidationContext context);
}
