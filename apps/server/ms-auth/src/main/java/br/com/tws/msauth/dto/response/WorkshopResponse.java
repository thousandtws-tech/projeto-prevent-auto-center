package br.com.tws.msauth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class WorkshopResponse {

    @Schema(description = "Identificador da oficina", example = "1")
    Long id;

    @Schema(description = "Nome da oficina", example = "Oficina Centro")
    String name;

    @Schema(description = "Slug unico da oficina", example = "oficina-centro")
    String slug;

    @Schema(description = "URL publica do logo da oficina",
            example = "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/logo.png")
    String logoUrl;

    @Schema(description = "URL publica da imagem usada na sidebar",
            example = "https://res.cloudinary.com/demo/image/upload/v1/prevent/workshops/1/sidebar.png")
    String sidebarImageUrl;
}
