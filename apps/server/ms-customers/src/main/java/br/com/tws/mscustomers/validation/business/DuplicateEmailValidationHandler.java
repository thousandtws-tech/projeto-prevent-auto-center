package br.com.tws.mscustomers.validation.business;

import br.com.tws.mscustomers.exception.DuplicateCustomerFieldException;
import br.com.tws.mscustomers.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class DuplicateEmailValidationHandler extends AbstractCustomerValidationHandler {

    private final CustomerRepository customerRepository;

    @Override
    protected Mono<Void> doValidate(CustomerValidationContext context) {
        Mono<Boolean> existsMono = context.currentCustomerId() == null
                ? customerRepository.existsByWorkshopIdAndEmail(context.workshopId(), context.command().email())
                : customerRepository.existsByWorkshopIdAndEmailAndIdNot(
                        context.workshopId(),
                        context.command().email(),
                        context.currentCustomerId()
                );

        return existsMono.flatMap(exists -> exists
                ? Mono.error(new DuplicateCustomerFieldException("email", context.command().email()))
                : Mono.empty());
    }
}
