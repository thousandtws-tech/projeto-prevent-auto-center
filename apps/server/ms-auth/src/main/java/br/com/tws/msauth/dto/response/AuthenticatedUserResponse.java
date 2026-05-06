package br.com.tws.msauth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class AuthenticatedUserResponse {

    @Schema(description = "Identificador do usuario", example = "1")
    Long id;

    @Schema(description = "Nome completo do usuario", example = "Ana Souza")
    String fullName;

    @Schema(description = "Email do usuario", example = "ana@oficinacentro.com")
    String email;

    @Schema(description = "Papel do usuario na oficina", example = "OWNER")
    String role;

    @Schema(description = "URL publica da foto de perfil do usuario",
            example = "https://res.cloudinary.com/demo/image/upload/v1/prevent/users/1/profile-photo.png")
    String profilePhotoUrl;
}
