package br.com.tws.mscustomers.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.dto.request.CustomerCreateRequest;
import br.com.tws.mscustomers.dto.request.CustomerUpdateRequest;
import br.com.tws.mscustomers.dto.response.CustomerResponse;
import br.com.tws.mscustomers.repository.CustomerRepository;
import br.com.tws.mscustomers.support.AbstractPostgresIntegrationTest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class CustomerControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final long WORKSHOP_ALPHA = 101L;
    private static final long WORKSHOP_BETA = 202L;

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private CustomerRepository customerRepository;

    @BeforeEach
    void cleanDatabase() {
        customerRepository.deleteAll().block();
    }

    @Test
    void shouldCreateAndFetchCustomer() {
        CustomerResponse created = authenticatedClient(WORKSHOP_ALPHA).post()
                .uri("/customers")
                .bodyValue(validCreateRequest())
                .exchange()
                .expectStatus().isCreated()
                .expectHeader().exists("Location")
                .expectBody(CustomerResponse.class)
                .returnResult()
                .getResponseBody();

        assertThat(created).isNotNull();
        assertThat(created.getId()).isNotNull();
        assertThat(created.getEmail()).isEqualTo("ana.souza@example.com");
        assertThat(created.getCep()).isEqualTo("74000000");
        assertThat(created.getLogradouro()).isEqualTo("Rua das Flores");
        assertThat(created.getNumero()).isEqualTo("123");
        assertThat(created.getBairro()).isEqualTo("Centro");
        assertThat(created.getCidade()).isEqualTo("Goiania");
        assertThat(created.getUf()).isEqualTo("GO");

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri("/customers/{id}", created.getId())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.nomeCompleto").isEqualTo("Ana Souza")
                .jsonPath("$.cpfCnpj").isEqualTo("52998224725")
                .jsonPath("$.logradouro").isEqualTo("Rua das Flores")
                .jsonPath("$.cidade").isEqualTo("Goiania");
    }

    @Test
    void shouldListCustomersWithFiltersAndPagination() {
        persistCustomer(WORKSHOP_ALPHA, "Ana Souza", "ana@example.com", "52998224725", "5511998765432");
        persistCustomer(WORKSHOP_BETA, "Carlos Lima", "carlos@example.com", "11444777000161", "5511988887777");

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri(uriBuilder -> uriBuilder.path("/customers")
                        .queryParam("page", 0)
                        .queryParam("size", 10)
                        .queryParam("sort", "nomeCompleto,asc")
                        .queryParam("nomeCompleto", "Ana")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.page").isEqualTo(0)
                .jsonPath("$.size").isEqualTo(10)
                .jsonPath("$.totalElements").isEqualTo(1)
                .jsonPath("$.content[0].email").isEqualTo("ana@example.com");
    }

    @Test
    void shouldUpdateCustomer() {
        CustomerEntity customer = persistCustomer(WORKSHOP_ALPHA, "Ana Souza", "ana@example.com", "52998224725", "5511998765432");

        authenticatedClient(WORKSHOP_ALPHA).put()
                .uri("/customers/{id}", customer.getId())
                .bodyValue(CustomerUpdateRequest.builder()
                        .nomeCompleto("Ana Paula Souza")
                        .telefone("+55 (11) 99999-0000")
                        .cpfCnpj("529.982.247-25")
                        .email("ana.paula@example.com")
                        .endereco("Rua das Flores, 200, Centro, Goiania - GO, 74000-000")
                        .cep("74000000")
                        .logradouro("Rua das Flores")
                        .numero("200")
                        .bairro("Centro")
                        .cidade("Goiania")
                        .uf("GO")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.nomeCompleto").isEqualTo("Ana Paula Souza")
                .jsonPath("$.telefone").isEqualTo("5511999990000")
                .jsonPath("$.email").isEqualTo("ana.paula@example.com")
                .jsonPath("$.numero").isEqualTo("200")
                .jsonPath("$.cep").isEqualTo("74000000");
    }

    @Test
    void shouldDeleteCustomer() {
        CustomerEntity customer = persistCustomer(WORKSHOP_ALPHA, "Carlos Lima", "carlos@example.com", "11444777000161", "5511988887777");

        authenticatedClient(WORKSHOP_ALPHA).delete()
                .uri("/customers/{id}", customer.getId())
                .exchange()
                .expectStatus().isNoContent();

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri("/customers/{id}", customer.getId())
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void shouldReturnConflictForDuplicatedEmail() {
        persistCustomer(WORKSHOP_ALPHA, "Ana Souza", "ana@example.com", "52998224725", "5511998765432");

        authenticatedClient(WORKSHOP_ALPHA).post()
                .uri("/customers")
                .bodyValue(CustomerCreateRequest.builder()
                        .nomeCompleto("Outra Ana")
                        .telefone("+55 (11) 97777-1111")
                        .cpfCnpj("111.444.777-35")
                        .email("ana@example.com")
                        .endereco("Rua B, 20")
                        .build())
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.status").isEqualTo(409)
                .jsonPath("$.message").isEqualTo("Ja existe cliente com e-mail informado.");
    }

    @Test
    void shouldAllowSameEmailAcrossDifferentWorkshops() {
        persistCustomer(WORKSHOP_BETA, "Ana Oficina B", "ana.souza@example.com", "11144477735", "5511977771111");

        authenticatedClient(WORKSHOP_ALPHA).post()
                .uri("/customers")
                .bodyValue(validCreateRequest())
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.email").isEqualTo("ana.souza@example.com");
    }

    @Test
    void shouldHideCustomerFromAnotherWorkshop() {
        CustomerEntity customer = persistCustomer(WORKSHOP_BETA, "Cliente Oficina B", "beta@example.com", "11444777000161", "5511988887777");

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri("/customers/{id}", customer.getId())
                .exchange()
                .expectStatus().isNotFound();
    }

    private CustomerCreateRequest validCreateRequest() {
        return CustomerCreateRequest.builder()
                .nomeCompleto("Ana Souza")
                .telefone("+55 (11) 99876-5432")
                .cpfCnpj("529.982.247-25")
                .email("Ana.Souza@example.com")
                .endereco("Rua das Flores, 123, Centro, Goiania - GO, 74000-000")
                .cep("74000000")
                .logradouro("Rua das Flores")
                .numero("123")
                .complemento("Casa 1")
                .bairro("Centro")
                .cidade("Goiania")
                .uf("GO")
                .build();
    }

    private CustomerEntity persistCustomer(long workshopId, String nomeCompleto, String email, String cpfCnpj, String telefone) {
        return customerRepository.save(CustomerEntity.builder()
                        .workshopId(workshopId)
                        .nomeCompleto(nomeCompleto)
                        .telefone(telefone)
                        .cpfCnpj(cpfCnpj)
                        .email(email)
                        .endereco("Rua das Flores, 123")
                        .cep("74000000")
                        .logradouro("Rua das Flores")
                        .numero("123")
                        .bairro("Centro")
                        .cidade("Goiania")
                        .uf("GO")
                        .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                        .updatedAt(OffsetDateTime.now(ZoneOffset.UTC))
                        .build())
                .block();
    }

    private WebTestClient authenticatedClient(long workshopId) {
        return webTestClient.mutateWith(mockJwt().jwt(jwt -> jwt
                .claim("sub", "owner@example.com")
                .claim("workshopId", workshopId)
                .claim("workshopSlug", "oficina-" + workshopId)
                .claim("roles", List.of("OWNER"))));
    }
}
