package br.com.tws.mscustomers.validation.business;

import br.com.tws.mscustomers.exception.DuplicateCustomerFieldException;
import br.com.tws.mscustomers.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class DuplicateCpfCnpjValidationHandler extends AbstractCustomerValidationHandler {

    private final CustomerRepository customerRepository;

    @Override
    protected Mono<Void> doValidate(CustomerValidationContext context) {
        Mono<Boolean> existsMono = context.currentCustomerId() == null
                ? customerRepository.existsByWorkshopIdAndCpfCnpj(context.workshopId(), context.command().cpfCnpj())
                : customerRepository.existsByWorkshopIdAndCpfCnpjAndIdNot(
                        context.workshopId(),
                        context.command().cpfCnpj(),
                        context.currentCustomerId()
                );

        return existsMono.flatMap(exists -> exists
                ? Mono.error(new DuplicateCustomerFieldException("cpfCnpj", context.command().cpfCnpj()))
                : Mono.empty());
    }
}
