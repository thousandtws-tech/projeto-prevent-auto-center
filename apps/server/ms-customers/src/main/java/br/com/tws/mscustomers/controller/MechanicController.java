package br.com.tws.mscustomers.controller;

import br.com.tws.mscustomers.dto.request.MechanicSearchRequest;
import br.com.tws.mscustomers.dto.request.MechanicUpsertRequest;
import br.com.tws.mscustomers.dto.response.ApiErrorResponse;
import br.com.tws.mscustomers.dto.response.MechanicResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.service.MechanicFacade;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/mechanics")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Mechanics", description = "Operacoes de cadastro, consulta, atualizacao e remocao de mecanicos responsaveis")
public class MechanicController {

    private final MechanicFacade mechanicFacade;

    @Operation(summary = "Cadastra um mecanico responsavel")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Mecanico cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public Mono<ResponseEntity<MechanicResponse>> create(@Valid @RequestBody MechanicUpsertRequest request) {
        return mechanicFacade.create(request)
                .map(response -> ResponseEntity.created(URI.create("/mechanics/" + response.getId())).body(response));
    }

    @Operation(summary = "Busca mecanico por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mecanico encontrado"),
            @ApiResponse(responseCode = "404", description = "Mecanico nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public Mono<MechanicResponse> getById(
            @Parameter(description = "ID do mecanico", example = "1") @PathVariable Long id
    ) {
        return mechanicFacade.getById(id);
    }

    @Operation(summary = "Lista mecanicos", description = "Lista mecanicos com paginacao, ordenacao e filtros opcionais.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parametros invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public Mono<PageResponse<MechanicResponse>> list(@Valid @ParameterObject @ModelAttribute MechanicSearchRequest request) {
        return mechanicFacade.list(request);
    }

    @Operation(summary = "Atualiza mecanico por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mecanico atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Mecanico nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{id}")
    public Mono<MechanicResponse> update(
            @Parameter(description = "ID do mecanico", example = "1") @PathVariable Long id,
            @Valid @RequestBody MechanicUpsertRequest request
    ) {
        return mechanicFacade.update(id, request);
    }

    @Operation(summary = "Remove mecanico por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Mecanico removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Mecanico nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(
            @Parameter(description = "ID do mecanico", example = "1") @PathVariable Long id
    ) {
        return mechanicFacade.delete(id)
                .thenReturn(ResponseEntity.noContent().build());
    }
}

