package br.com.tws.mscustomers.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.model.CustomerCommand;
import br.com.tws.mscustomers.domain.model.CustomerSearchCriteria;
import br.com.tws.mscustomers.domain.model.CustomerSortField;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.exception.CustomerNotFoundException;
import br.com.tws.mscustomers.repository.CustomerRepository;
import br.com.tws.mscustomers.repository.CustomerSearchRepository;
import br.com.tws.mscustomers.service.CustomerFactory;
import br.com.tws.mscustomers.validation.business.CustomerValidationChain;
import br.com.tws.mscustomers.validation.business.CustomerValidationContext;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    private static final long WORKSHOP_ID = 101L;

    private static final Clock FIXED_CLOCK = Clock.fixed(
            Instant.parse("2026-03-06T12:00:00Z"),
            ZoneOffset.UTC
    );

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerSearchRepository customerSearchRepository;

    @Mock
    private CustomerValidationChain customerValidationChain;

    @Captor
    private ArgumentCaptor<CustomerEntity> customerCaptor;

    private CustomerServiceImpl customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerServiceImpl(
                customerRepository,
                customerSearchRepository,
                new CustomerFactory(FIXED_CLOCK),
                customerValidationChain
        );
    }

    @Test
    void shouldCreateCustomerAfterValidation() {
        CustomerCommand command = validCommand();
        when(customerValidationChain.validate(any(CustomerValidationContext.class))).thenReturn(Mono.empty());
        when(customerRepository.save(any(CustomerEntity.class))).thenAnswer(invocation -> {
            CustomerEntity entity = invocation.getArgument(0, CustomerEntity.class);
            return Mono.just(entity.toBuilder().id(1L).build());
        });

        StepVerifier.create(customerService.create(WORKSHOP_ID, command))
                .assertNext(customer -> {
                    assertThat(customer.getId()).isEqualTo(1L);
                    assertThat(customer.getWorkshopId()).isEqualTo(WORKSHOP_ID);
                    assertThat(customer.getEmail()).isEqualTo("ana.souza@example.com");
                    assertThat(customer.getCreatedAt()).isEqualTo(OffsetDateTime.now(FIXED_CLOCK));
                    assertThat(customer.getUpdatedAt()).isEqualTo(OffsetDateTime.now(FIXED_CLOCK));
                })
                .verifyComplete();

        verify(customerValidationChain).validate(argThat(context ->
                context.workshopId().equals(WORKSHOP_ID)
                        && context.currentCustomerId() == null
                        && context.command().equals(command)
        ));
        verify(customerRepository).save(customerCaptor.capture());
        assertThat(customerCaptor.getValue().getWorkshopId()).isEqualTo(WORKSHOP_ID);
        assertThat(customerCaptor.getValue().getCpfCnpj()).isEqualTo("52998224725");
    }

    @Test
    void shouldReturnNotFoundWhenCustomerDoesNotExist() {
        when(customerRepository.findByIdAndWorkshopId(99L, WORKSHOP_ID)).thenReturn(Mono.empty());

        StepVerifier.create(customerService.getById(WORKSHOP_ID, 99L))
                .expectError(CustomerNotFoundException.class)
                .verify();
    }

    @Test
    void shouldListCustomersWithPageMetadata() {
        CustomerEntity customer = customerEntity(1L, "Ana Souza", "ana.souza@example.com", "52998224725");
        PageQuery pageQuery = PageQuery.builder()
                .page(0)
                .size(10)
                .sortField(CustomerSortField.NOME_COMPLETO)
                .direction(Sort.Direction.ASC)
                .build();

        when(customerSearchRepository.search(any(Long.class), any(CustomerSearchCriteria.class), any(PageQuery.class)))
                .thenReturn(Flux.just(customer));
        when(customerSearchRepository.count(any(Long.class), any(CustomerSearchCriteria.class))).thenReturn(Mono.just(1L));

        StepVerifier.create(customerService.list(WORKSHOP_ID, CustomerSearchCriteria.builder().nomeCompleto("Ana").build(), pageQuery))
                .assertNext(result -> {
                    assertThat(result.getContent()).hasSize(1);
                    assertThat(result.getTotalElements()).isEqualTo(1L);
                    assertThat(result.getPageQuery()).isEqualTo(pageQuery);
                })
                .verifyComplete();
    }

    @Test
    void shouldUpdateExistingCustomer() {
        CustomerCommand command = CustomerCommand.builder()
                .nomeCompleto("Ana Paula Souza")
                .telefone("5511999990000")
                .cpfCnpj("52998224725")
                .email("ana.paula@example.com")
                .endereco("Rua das Flores, 200")
                .cep("74000000")
                .logradouro("Rua das Flores")
                .numero("200")
                .bairro("Centro")
                .cidade("Goiania")
                .uf("GO")
                .build();
        CustomerEntity existing = customerEntity(10L, "Ana Souza", "ana.souza@example.com", "52998224725");

        when(customerRepository.findByIdAndWorkshopId(10L, WORKSHOP_ID)).thenReturn(Mono.just(existing));
        when(customerValidationChain.validate(any(CustomerValidationContext.class))).thenReturn(Mono.empty());
        when(customerRepository.save(any(CustomerEntity.class))).thenAnswer(invocation ->
                Mono.just(invocation.getArgument(0, CustomerEntity.class))
        );

        StepVerifier.create(customerService.update(WORKSHOP_ID, 10L, command))
                .assertNext(updated -> {
                    assertThat(updated.getId()).isEqualTo(10L);
                    assertThat(updated.getWorkshopId()).isEqualTo(WORKSHOP_ID);
                    assertThat(updated.getNomeCompleto()).isEqualTo("Ana Paula Souza");
                    assertThat(updated.getEmail()).isEqualTo("ana.paula@example.com");
                    assertThat(updated.getCep()).isEqualTo("74000000");
                    assertThat(updated.getNumero()).isEqualTo("200");
                    assertThat(updated.getUpdatedAt()).isEqualTo(OffsetDateTime.now(FIXED_CLOCK));
                })
                .verifyComplete();

        verify(customerValidationChain).validate(argThat(context ->
                context.workshopId().equals(WORKSHOP_ID)
                        && context.currentCustomerId().equals(10L)
                        && context.command().equals(command)
        ));
    }

    @Test
    void shouldDeleteExistingCustomer() {
        CustomerEntity existing = customerEntity(20L, "Carlos Lima", "carlos@example.com", "11444777000161");

        when(customerRepository.findByIdAndWorkshopId(20L, WORKSHOP_ID)).thenReturn(Mono.just(existing));
        when(customerRepository.delete(existing)).thenReturn(Mono.empty());

        StepVerifier.create(customerService.delete(WORKSHOP_ID, 20L))
                .verifyComplete();

        verify(customerRepository).delete(existing);
    }

    private CustomerCommand validCommand() {
        return CustomerCommand.builder()
                .nomeCompleto("Ana Souza")
                .telefone("5511998765432")
                .cpfCnpj("52998224725")
                .email("ana.souza@example.com")
                .endereco("Rua das Flores, 123")
                .cep("74000000")
                .logradouro("Rua das Flores")
                .numero("123")
                .bairro("Centro")
                .cidade("Goiania")
                .uf("GO")
                .build();
    }

    private CustomerEntity customerEntity(Long id, String nomeCompleto, String email, String cpfCnpj) {
        return CustomerEntity.builder()
                .id(id)
                .workshopId(WORKSHOP_ID)
                .nomeCompleto(nomeCompleto)
                .telefone("5511998765432")
                .cpfCnpj(cpfCnpj)
                .email(email)
                .endereco("Rua das Flores, 123")
                .cep("74000000")
                .logradouro("Rua das Flores")
                .numero("123")
                .bairro("Centro")
                .cidade("Goiania")
                .uf("GO")
                .createdAt(OffsetDateTime.now(FIXED_CLOCK).minusDays(1))
                .updatedAt(OffsetDateTime.now(FIXED_CLOCK).minusHours(2))
                .build();
    }
}
