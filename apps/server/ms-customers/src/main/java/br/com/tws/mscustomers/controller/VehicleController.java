package br.com.tws.mscustomers.controller;

import br.com.tws.mscustomers.dto.request.VehicleCreateRequest;
import br.com.tws.mscustomers.dto.request.VehicleSearchRequest;
import br.com.tws.mscustomers.dto.request.VehicleUpdateRequest;
import br.com.tws.mscustomers.dto.response.ApiErrorResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.dto.response.VehicleResponse;
import br.com.tws.mscustomers.service.VehicleFacade;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.net.URI;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/vehicles")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Vehicles", description = "Operacoes de cadastro, consulta, atualizacao e remocao de veiculos")
public class VehicleController {

    private final VehicleFacade vehicleFacade;

    @Operation(
            summary = "Cadastra um veiculo",
            description = "Cria um novo veiculo com validacao de placa e chassi unicos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Veiculo cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Veiculo ja existente", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public Mono<ResponseEntity<VehicleResponse>> create(@Valid @RequestBody VehicleCreateRequest request) {
        return vehicleFacade.create(request)
                .map(response -> ResponseEntity
                        .created(URI.create("/vehicles/" + response.getId()))
                        .body(response));
    }

    @Operation(summary = "Busca veiculo por ID", description = "Retorna um veiculo especifico a partir do identificador informado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Veiculo encontrado"),
            @ApiResponse(responseCode = "404", description = "Veiculo nao encontrado", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public Mono<VehicleResponse> getById(@Parameter(description = "ID do veiculo", example = "1") @PathVariable Long id) {
        return vehicleFacade.getById(id);
    }

    @Operation(
            summary = "Lista veiculos",
            description = "Lista veiculos com paginacao, ordenacao e filtros opcionais."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parametros invalidos", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public Mono<PageResponse<VehicleResponse>> list(@Valid @ParameterObject @ModelAttribute VehicleSearchRequest request) {
        return vehicleFacade.list(request);
    }

    @Operation(summary = "Atualiza um veiculo", description = "Atualiza todos os dados de um veiculo existente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Veiculo atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Veiculo nao encontrado", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Conflito de unicidade", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public Mono<VehicleResponse> update(
            @Parameter(description = "ID do veiculo", example = "1") @PathVariable Long id,
            @Valid @RequestBody VehicleUpdateRequest request
    ) {
        return vehicleFacade.update(id, request);
    }

    @Operation(summary = "Remove um veiculo", description = "Exclui um veiculo pelo identificador informado.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Veiculo removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Veiculo nao encontrado", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@Parameter(description = "ID do veiculo", example = "1") @PathVariable Long id) {
        return vehicleFacade.delete(id)
                .thenReturn(ResponseEntity.noContent().build());
    }
}
