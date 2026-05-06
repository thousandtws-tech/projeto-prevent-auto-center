package br.com.tws.mscustomers.validation.business;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import br.com.tws.mscustomers.domain.model.CustomerCommand;
import br.com.tws.mscustomers.exception.DuplicateCustomerFieldException;
import br.com.tws.mscustomers.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class DuplicateEmailValidationHandlerTest {

    private static final long WORKSHOP_ID = 101L;

    @Mock
    private CustomerRepository customerRepository;

    private DuplicateEmailValidationHandler handler;

    @BeforeEach
    void setUp() {
        handler = new DuplicateEmailValidationHandler(customerRepository);
    }

    @Test
    void shouldReturnConflictWhenEmailAlreadyExistsOnCreate() {
        CustomerValidationContext context = new CustomerValidationContext(WORKSHOP_ID, validCommand(), null);
        when(customerRepository.existsByWorkshopIdAndEmail(WORKSHOP_ID, "ana@example.com")).thenReturn(Mono.just(true));

        StepVerifier.create(handler.validate(context))
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(DuplicateCustomerFieldException.class);
                    assertThat(error.getMessage()).contains("e-mail");
                })
                .verify();
    }

    @Test
    void shouldIgnoreSameCustomerOnUpdate() {
        CustomerValidationContext context = new CustomerValidationContext(WORKSHOP_ID, validCommand(), 8L);
        when(customerRepository.existsByWorkshopIdAndEmailAndIdNot(eq(WORKSHOP_ID), eq("ana@example.com"), anyLong()))
                .thenReturn(Mono.just(false));

        StepVerifier.create(handler.validate(context))
                .verifyComplete();
    }

    private CustomerCommand validCommand() {
        return CustomerCommand.builder()
                .nomeCompleto("Ana Souza")
                .telefone("5511998765432")
                .cpfCnpj("52998224725")
                .email("ana@example.com")
                .endereco("Rua das Flores, 123")
                .cep("74000000")
                .logradouro("Rua das Flores")
                .numero("123")
                .bairro("Centro")
                .cidade("Goiania")
                .uf("GO")
                .build();
    }
}
