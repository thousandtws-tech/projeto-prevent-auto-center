package br.com.tws.msbackup.controller;

import br.com.tws.monolith.exception.ApiErrorResponse;
import br.com.tws.msbackup.domain.model.BackupDownloadArtifact;
import br.com.tws.msbackup.dto.request.BackupSettingsUpdateRequest;
import br.com.tws.msbackup.dto.response.BackupImportResponse;
import br.com.tws.msbackup.dto.response.BackupRunResponse;
import br.com.tws.msbackup.dto.response.BackupSettingsResponse;
import br.com.tws.msbackup.service.BackupFacade;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/backups")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Backups", description = "Operacoes de backup geral do sistema por oficina")
public class BackupController {

    private final BackupFacade backupFacade;

    @Operation(summary = "Consulta a configuracao atual do backup")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Configuracao retornada com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para acessar o modulo de backup",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/settings")
    public Mono<BackupSettingsResponse> getSettings() {
        return backupFacade.getSettings();
    }

    @Operation(summary = "Atualiza a configuracao de backup automatico")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Configuracao atualizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissao para alterar backups",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PutMapping("/settings")
    public Mono<BackupSettingsResponse> updateSettings(@Valid @RequestBody BackupSettingsUpdateRequest request) {
        return backupFacade.updateSettings(request);
    }

    @Operation(summary = "Executa um backup manual completo")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Backup gerado com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para executar backups",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping("/run")
    public Mono<ResponseEntity<BackupRunResponse>> runManualBackup() {
        return backupFacade.runManualBackup()
                .map(response -> ResponseEntity.created(URI.create("/backups/history/" + response.id()))
                        .body(response));
    }

    @Operation(summary = "Importa e restaura um backup ZIP da oficina")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Backup restaurado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Arquivo invalido ou estrutura de backup inconsistente",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissao para importar backups",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<BackupImportResponse> importBackup(@RequestPart("file") FilePart filePart) {
        return backupFacade.importBackup(filePart);
    }

    @Operation(summary = "Lista o historico de backups da oficina")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Historico retornado com sucesso"),
            @ApiResponse(responseCode = "403", description = "Sem permissao para acessar o historico",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/history")
    public Mono<List<BackupRunResponse>> listHistory(
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) Integer limit
    ) {
        return backupFacade.listHistory(limit);
    }

    @Operation(summary = "Baixa o arquivo ZIP de um backup concluido")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Arquivo retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Backup nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/history/{id}/download")
    public Mono<ResponseEntity<Resource>> download(@PathVariable Long id) {
        return backupFacade.download(id)
                .map(this::toDownloadResponse);
    }

    private ResponseEntity<Resource> toDownloadResponse(BackupDownloadArtifact artifact) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(artifact.fileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .contentLength(artifact.fileSizeBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(artifact.resource());
    }
}
