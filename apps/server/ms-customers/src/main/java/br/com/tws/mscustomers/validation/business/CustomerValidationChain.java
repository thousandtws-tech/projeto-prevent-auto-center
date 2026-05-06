package br.com.tws.mscustomers.validation.business;

import lombok.Getter;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Getter
@Component
public class CustomerValidationChain {

    private final AbstractCustomerValidationHandler firstHandler;

    public CustomerValidationChain(
            DuplicateCpfCnpjValidationHandler duplicateCpfCnpjValidationHandler,
            DuplicateEmailValidationHandler duplicateEmailValidationHandler
    ) {
        duplicateCpfCnpjValidationHandler.linkWith(duplicateEmailValidationHandler);
        this.firstHandler = duplicateCpfCnpjValidationHandler;
    }

    public Mono<Void> validate(CustomerValidationContext context) {
        return firstHandler.validate(context);
    }
}
