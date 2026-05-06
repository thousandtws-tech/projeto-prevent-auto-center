package br.com.tws.msserviceorders.controller;

import br.com.tws.msserviceorders.dto.request.ServiceOrderCatalogItemUpsertRequest;
import br.com.tws.msserviceorders.dto.response.ApiErrorResponse;
import br.com.tws.msserviceorders.dto.response.ServiceOrderCatalogItemResponse;
import br.com.tws.msserviceorders.service.ServiceOrderCatalogItemFacade;
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
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/service-order-catalog-items")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Service Order Catalog", description = "Operacoes de cadastro de pecas e mao de obra reutilizaveis na ordem de servico")
public class ServiceOrderCatalogItemController {

    private final ServiceOrderCatalogItemFacade serviceOrderCatalogItemFacade;

    @Operation(summary = "Cadastra um item de catalogo da ordem de servico")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Item cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public Mono<ResponseEntity<ServiceOrderCatalogItemResponse>> create(
            @Valid @RequestBody ServiceOrderCatalogItemUpsertRequest request
    ) {
        return serviceOrderCatalogItemFacade.create(request)
                .map(response -> ResponseEntity
                        .created(URI.create("/service-order-catalog-items/" + response.getId()))
                        .body(response));
    }

    @Operation(summary = "Lista itens do catalogo por tipo")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parametro invalido",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public Flux<ServiceOrderCatalogItemResponse> list(
            @Parameter(description = "Tipo do item: part ou labor") @RequestParam String type
    ) {
        return serviceOrderCatalogItemFacade.list(type);
    }

    @Operation(summary = "Busca item de catalogo por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item encontrado"),
            @ApiResponse(responseCode = "404", description = "Item nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public Mono<ServiceOrderCatalogItemResponse> getById(
            @Parameter(description = "ID do item de catalogo", example = "1") @PathVariable Long id
    ) {
        return serviceOrderCatalogItemFacade.getById(id);
    }

    @Operation(summary = "Atualiza item de catalogo por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Item nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{id}")
    public Mono<ServiceOrderCatalogItemResponse> update(
            @Parameter(description = "ID do item de catalogo", example = "1") @PathVariable Long id,
            @Valid @RequestBody ServiceOrderCatalogItemUpsertRequest request
    ) {
        return serviceOrderCatalogItemFacade.update(id, request);
    }

    @Operation(summary = "Remove item de catalogo por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Item removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Item nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(
            @Parameter(description = "ID do item de catalogo", example = "1") @PathVariable Long id
    ) {
        return serviceOrderCatalogItemFacade.delete(id)
                .thenReturn(ResponseEntity.noContent().build());
    }
}
