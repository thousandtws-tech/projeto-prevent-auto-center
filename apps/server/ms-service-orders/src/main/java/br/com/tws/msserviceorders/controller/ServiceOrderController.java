package br.com.tws.msserviceorders.controller;

import br.com.tws.msserviceorders.dto.request.ServiceOrderSearchRequest;
import br.com.tws.msserviceorders.dto.request.ServiceOrderUpsertRequest;
import br.com.tws.msserviceorders.dto.request.SignSharedServiceOrderRequest;
import br.com.tws.msserviceorders.dto.response.ApiErrorResponse;
import br.com.tws.msserviceorders.dto.response.PageResponse;
import br.com.tws.msserviceorders.dto.response.ServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.ShareServiceOrderResponse;
import br.com.tws.msserviceorders.dto.response.SharedServiceOrderResponse;
import br.com.tws.msserviceorders.service.ServiceOrderFacade;
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
@RequestMapping("/service-orders")
@Tag(name = "Service Orders", description = "Operacoes de cadastro, consulta, compartilhamento e assinatura de ordens de servico")
public class ServiceOrderController {

    private final ServiceOrderFacade serviceOrderFacade;

    @Operation(summary = "Cadastra uma ordem de servico")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Ordem de servico cadastrada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    public Mono<ResponseEntity<ServiceOrderResponse>> create(@Valid @RequestBody ServiceOrderUpsertRequest request) {
        return serviceOrderFacade.create(request)
                .map(response -> ResponseEntity.created(URI.create("/service-orders/" + response.getId())).body(response));
    }

    @Operation(summary = "Busca ordem de servico por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ordem encontrada"),
            @ApiResponse(responseCode = "404", description = "Ordem nao encontrada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/{id}")
    public Mono<ServiceOrderResponse> getById(
            @Parameter(description = "ID da ordem de servico", example = "1") @PathVariable Long id
    ) {
        return serviceOrderFacade.getById(id);
    }

    @Operation(summary = "Lista ordens de servico")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parametros invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping
    public Mono<PageResponse<ServiceOrderResponse>> list(
            @Valid @ParameterObject @ModelAttribute ServiceOrderSearchRequest request
    ) {
        return serviceOrderFacade.list(request);
    }

    @Operation(summary = "Atualiza uma ordem de servico")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ordem atualizada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Ordem nao encontrada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @SecurityRequirement(name = "bearerAuth")
    @PatchMapping("/{id}")
    public Mono<ServiceOrderResponse> update(
            @Parameter(description = "ID da ordem de servico", example = "1") @PathVariable Long id,
            @Valid @RequestBody ServiceOrderUpsertRequest request
    ) {
        return serviceOrderFacade.update(id, request);
    }

    @Operation(summary = "Remove uma ordem de servico")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Ordem removida com sucesso"),
            @ApiResponse(responseCode = "404", description = "Ordem nao encontrada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(
            @Parameter(description = "ID da ordem de servico", example = "1") @PathVariable Long id
    ) {
        return serviceOrderFacade.delete(id)
                .thenReturn(ResponseEntity.noContent().build());
    }

    @Operation(summary = "Gera ou recupera o link de assinatura da ordem")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Link gerado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Ordem nao encontrada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{id}/share")
    public Mono<ShareServiceOrderResponse> share(
            @Parameter(description = "ID da ordem de servico", example = "1") @PathVariable Long id
    ) {
        return serviceOrderFacade.share(id);
    }

    @Operation(summary = "Busca ordem compartilhada por token", description = "Endpoint publico usado pela tela de assinatura.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ordem compartilhada encontrada"),
            @ApiResponse(responseCode = "404", description = "Token nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/shared/{token}")
    public Mono<SharedServiceOrderResponse> getSharedByToken(
            @Parameter(description = "Token publico da ordem compartilhada") @PathVariable String token
    ) {
        return serviceOrderFacade.getSharedByToken(token);
    }

    @Operation(summary = "Assina a ordem compartilhada", description = "Endpoint publico para registrar assinatura e recusas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ordem assinada com sucesso"),
            @ApiResponse(responseCode = "404", description = "Token nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Ordem ja assinada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/shared/{token}/sign")
    public Mono<SharedServiceOrderResponse> signByToken(
            @Parameter(description = "Token publico da ordem compartilhada") @PathVariable String token,
            @Valid @RequestBody SignSharedServiceOrderRequest request
    ) {
        return serviceOrderFacade.signByToken(token, request);
    }
}
