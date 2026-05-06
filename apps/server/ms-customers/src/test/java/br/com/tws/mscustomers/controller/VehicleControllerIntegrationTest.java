package br.com.tws.mscustomers.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

import br.com.tws.mscustomers.domain.entity.VehicleEntity;
import br.com.tws.mscustomers.dto.request.VehicleCreateRequest;
import br.com.tws.mscustomers.dto.request.VehicleUpdateRequest;
import br.com.tws.mscustomers.dto.response.VehicleResponse;
import br.com.tws.mscustomers.repository.VehicleRepository;
import br.com.tws.mscustomers.support.AbstractPostgresIntegrationTest;
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
class VehicleControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final long WORKSHOP_ALPHA = 101L;
    private static final long WORKSHOP_BETA = 202L;

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private VehicleRepository vehicleRepository;

    @BeforeEach
    void cleanDatabase() {
        vehicleRepository.deleteAll().block();
    }

    @Test
    void shouldCreateAndFetchVehicle() {
        VehicleResponse created = authenticatedClient(WORKSHOP_ALPHA).post()
                .uri("/vehicles")
                .bodyValue(validCreateRequest())
                .exchange()
                .expectStatus().isCreated()
                .expectHeader().exists("Location")
                .expectBody(VehicleResponse.class)
                .returnResult()
                .getResponseBody();

        assertThat(created).isNotNull();
        assertThat(created.getId()).isNotNull();
        assertThat(created.getModelo()).isEqualTo("Onix");
        assertThat(created.getPlate()).isEqualTo("ABC1D23");

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri("/vehicles/{id}", created.getId())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.modelo").isEqualTo("Onix")
                .jsonPath("$.brand").isEqualTo("Chevrolet")
                .jsonPath("$.plate").isEqualTo("ABC1D23")
                .jsonPath("$.chassiNumber").isEqualTo("9BWZZZ377VT004251")
                .jsonPath("$.mileage").isEqualTo(15000)
                .jsonPath("$.year").isEqualTo(2022);
    }

    @Test
    void shouldListVehiclesWithFiltersAndPagination() {
        persistVehicle(WORKSHOP_ALPHA, "Onix", "Chevrolet", "ABC1D23", "9BWZZZ377VT004251", 15000L, 2022L, "Branco");
        persistVehicle(WORKSHOP_BETA, "Tracker", "Chevrolet", "XYZ9E87", "9BWZZZ377VT004252", 8000L, 2023L, "Preto");

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri(uriBuilder -> uriBuilder.path("/vehicles")
                        .queryParam("page", 0)
                        .queryParam("size", 10)
                        .queryParam("sort", "modelo,asc")
                        .queryParam("modelo", "Onix")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.page").isEqualTo(0)
                .jsonPath("$.size").isEqualTo(10)
                .jsonPath("$.totalElements").isEqualTo(1)
                .jsonPath("$.content[0].modelo").isEqualTo("Onix")
                .jsonPath("$.content[0].plate").isEqualTo("ABC1D23");
    }

    @Test
    void shouldUpdateVehicle() {
        VehicleEntity vehicle = persistVehicle(WORKSHOP_ALPHA, "Onix", "Chevrolet", "ABC1D23", "9BWZZZ377VT004251", 15000L, 2022L, "Branco");

        authenticatedClient(WORKSHOP_ALPHA).put()
                .uri("/vehicles/{id}", vehicle.getId())
                .bodyValue(VehicleUpdateRequest.builder()
                        .model("Onix Plus")
                        .brand("Chevrolet")
                        .plate("ABC1D23")
                        .chassisNumber("9BWZZZ377VT004251")
                        .mileage(20000L)
                        .year(2022L)
                        .color("Prata")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.modelo").isEqualTo("Onix Plus")
                .jsonPath("$.mileage").isEqualTo(20000)
                .jsonPath("$.color").isEqualTo("Prata");
    }

    @Test
    void shouldDeleteVehicle() {
        VehicleEntity vehicle = persistVehicle(WORKSHOP_ALPHA, "Tracker", "Chevrolet", "XYZ9E87", "9BWZZZ377VT004252", 8000L, 2023L, "Preto");

        authenticatedClient(WORKSHOP_ALPHA).delete()
                .uri("/vehicles/{id}", vehicle.getId())
                .exchange()
                .expectStatus().isNoContent();

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri("/vehicles/{id}", vehicle.getId())
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void shouldReturnConflictForDuplicatedPlate() {
        persistVehicle(WORKSHOP_ALPHA, "Onix", "Chevrolet", "ABC1D23", "9BWZZZ377VT004251", 15000L, 2022L, "Branco");

        authenticatedClient(WORKSHOP_ALPHA).post()
                .uri("/vehicles")
                .bodyValue(VehicleCreateRequest.builder()
                        .model("Tracker")
                        .brand("Chevrolet")
                        .plate("ABC1D23")
                        .chassisNumber("9BWZZZ377VT004252")
                        .mileage(8000L)
                        .year(2023L)
                        .color("Preto")
                        .build())
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.status").isEqualTo(409)
                .jsonPath("$.message").isEqualTo("Ja existe veiculo com placa informado.");
    }

    @Test
    void shouldReturnConflictForDuplicatedChassisNumber() {
        persistVehicle(WORKSHOP_ALPHA, "Onix", "Chevrolet", "ABC1D23", "9BWZZZ377VT004251", 15000L, 2022L, "Branco");

        authenticatedClient(WORKSHOP_ALPHA).post()
                .uri("/vehicles")
                .bodyValue(VehicleCreateRequest.builder()
                        .model("Tracker")
                        .brand("Chevrolet")
                        .plate("XYZ9E87")
                        .chassisNumber("9BWZZZ377VT004251")
                        .mileage(8000L)
                        .year(2023L)
                        .color("Preto")
                        .build())
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.status").isEqualTo(409)
                .jsonPath("$.message").isEqualTo("Ja existe veiculo com chassi informado.");
    }

    @Test
    void shouldAllowSamePlateAcrossDifferentWorkshops() {
        persistVehicle(WORKSHOP_BETA, "Onix", "Chevrolet", "ABC1D23", "9BWZZZ377VT004251", 15000L, 2022L, "Branco");

        authenticatedClient(WORKSHOP_ALPHA).post()
                .uri("/vehicles")
                .bodyValue(validCreateRequest())
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.plate").isEqualTo("ABC1D23");
    }

    @Test
    void shouldHideVehicleFromAnotherWorkshop() {
        VehicleEntity vehicle = persistVehicle(WORKSHOP_BETA, "Tracker", "Chevrolet", "XYZ9E87", "9BWZZZ377VT004252", 8000L, 2023L, "Preto");

        authenticatedClient(WORKSHOP_ALPHA).get()
                .uri("/vehicles/{id}", vehicle.getId())
                .exchange()
                .expectStatus().isNotFound();
    }

    private VehicleCreateRequest validCreateRequest() {
        return VehicleCreateRequest.builder()
                .model("Onix")
                .brand("Chevrolet")
                .plate("ABC1D23")
                .chassisNumber("9BWZZZ377VT004251")
                .mileage(15000L)
                .year(2022L)
                .color("Branco")
                .build();
    }

    private VehicleEntity persistVehicle(long workshopId, String model, String brand, String plate, String chassisNumber,
                                         Long mileage, Long year, String color) {
        return vehicleRepository.save(VehicleEntity.builder()
                        .workshopId(workshopId)
                        .model(model)
                        .brand(brand)
                        .plate(plate)
                        .chassisNumber(chassisNumber)
                        .mileage(mileage)
                        .year(year)
                        .color(color)
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
