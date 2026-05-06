package br.com.tws.msscheduling.controller;

import br.com.tws.msscheduling.dto.request.SchedulingAppointmentCreateRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentPatchRequest;
import br.com.tws.msscheduling.dto.request.SchedulingAppointmentSearchRequest;
import br.com.tws.msscheduling.dto.response.ApiErrorResponse;
import br.com.tws.msscheduling.dto.response.PageResponse;
import br.com.tws.msscheduling.dto.response.SchedulingAppointmentResponse;
import br.com.tws.msscheduling.service.SchedulingAppointmentFacade;
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
@RequestMapping("/scheduling/appointments")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Scheduling", description = "Operacoes de cadastro, consulta e atualizacao de agendamentos")
public class SchedulingAppointmentController {

    private final SchedulingAppointmentFacade schedulingAppointmentFacade;

    @Operation(summary = "Cadastra um agendamento")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Agendamento cadastrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    public Mono<ResponseEntity<SchedulingAppointmentResponse>> create(
            @Valid @RequestBody SchedulingAppointmentCreateRequest request
    ) {
        return schedulingAppointmentFacade.create(request)
                .map(response -> ResponseEntity.created(URI.create("/scheduling/appointments/" + response.getId())).body(response));
    }

    @Operation(summary = "Busca agendamento por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Agendamento encontrado"),
            @ApiResponse(responseCode = "404", description = "Agendamento nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public Mono<SchedulingAppointmentResponse> getById(
            @Parameter(description = "ID do agendamento", example = "1") @PathVariable Long id
    ) {
        return schedulingAppointmentFacade.getById(id);
    }

    @Operation(summary = "Lista agendamentos")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parametros invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public Mono<PageResponse<SchedulingAppointmentResponse>> list(
            @Valid @ParameterObject @ModelAttribute SchedulingAppointmentSearchRequest request
    ) {
        return schedulingAppointmentFacade.list(request);
    }

    @Operation(summary = "Atualiza um agendamento")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Agendamento atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Agendamento nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PatchMapping("/{id}")
    public Mono<SchedulingAppointmentResponse> update(
            @Parameter(description = "ID do agendamento", example = "1") @PathVariable Long id,
            @Valid @RequestBody SchedulingAppointmentPatchRequest request
    ) {
        return schedulingAppointmentFacade.update(id, request);
    }

    @Operation(summary = "Remove um agendamento")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Agendamento removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Agendamento nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(
            @Parameter(description = "ID do agendamento", example = "1") @PathVariable Long id
    ) {
        return schedulingAppointmentFacade.delete(id)
                .thenReturn(ResponseEntity.noContent().build());
    }

    @Operation(summary = "Remove todos os agendamentos da oficina autenticada")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Agendamentos removidos com sucesso")
    })
    @DeleteMapping
    public Mono<ResponseEntity<Void>> clearAll() {
        return schedulingAppointmentFacade.clearAll()
                .thenReturn(ResponseEntity.noContent().build());
    }
}
