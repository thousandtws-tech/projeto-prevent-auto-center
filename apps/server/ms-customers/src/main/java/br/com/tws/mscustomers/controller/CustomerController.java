package br.com.tws.mscustomers.controller;

import br.com.tws.mscustomers.dto.request.CustomerCreateRequest;
import br.com.tws.mscustomers.dto.request.CustomerSearchRequest;
import br.com.tws.mscustomers.dto.request.CustomerUpdateRequest;
import br.com.tws.mscustomers.dto.response.ApiErrorResponse;
import br.com.tws.mscustomers.dto.response.CustomerResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.service.CustomerFacade;
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
@RequestMapping("/customers")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Customers", description = "Operacoes de cadastro, consulta, atualizacao e remocao de clientes")
public class CustomerController {

    private final CustomerFacade customerFacade;

    @Operation(
            summary = "Cadastra um cliente",
            description = "Cria um novo cliente com validacao de dados e regras de unicidade para e-mail e CPF/CNPJ."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Cliente cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Cliente ja existente", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public Mono<ResponseEntity<CustomerResponse>> create(@Valid @RequestBody CustomerCreateRequest request) {
        return customerFacade.create(request)
                .map(response -> ResponseEntity
                        .created(URI.create("/customers/" + response.getId()))
                        .body(response));
    }

    @Operation(summary = "Busca cliente por ID", description = "Retorna um cliente especifico a partir do identificador informado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cliente encontrado"),
            @ApiResponse(responseCode = "404", description = "Cliente nao encontrado", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public Mono<CustomerResponse> getById(@Parameter(description = "ID do cliente", example = "1") @PathVariable Long id) {
        return customerFacade.getById(id);
    }

    @Operation(
            summary = "Lista clientes",
            description = "Lista clientes com paginacao, ordenacao e filtros opcionais."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parametros invalidos", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public Mono<PageResponse<CustomerResponse>> list(@Valid @ParameterObject @ModelAttribute CustomerSearchRequest request) {
        return customerFacade.list(request);
    }

    @Operation(summary = "Atualiza um cliente", description = "Atualiza todos os dados de um cliente existente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cliente atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Cliente nao encontrado", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Conflito de unicidade", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public Mono<CustomerResponse> update(
            @Parameter(description = "ID do cliente", example = "1") @PathVariable Long id,
            @Valid @RequestBody CustomerUpdateRequest request
    ) {
        return customerFacade.update(id, request);
    }

    @Operation(summary = "Remove um cliente", description = "Exclui um cliente pelo identificador informado.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Cliente removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Cliente nao encontrado", content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@Parameter(description = "ID do cliente", example = "1") @PathVariable Long id) {
        return customerFacade.delete(id)
                .thenReturn(ResponseEntity.noContent().build());
    }
}
