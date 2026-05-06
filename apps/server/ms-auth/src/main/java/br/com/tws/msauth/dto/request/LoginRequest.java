package br.com.tws.msauth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @Schema(description = "Slug da oficina. Opcional quando o email identifica unicamente o usuario.", example = "oficina-centro")
    @Size(max = 50, message = "workshopSlug deve ter no maximo 50 caracteres.")
    private String workshopSlug;

    @Schema(description = "Email do usuario", example = "ana@oficinacentro.com")
    @jakarta.validation.constraints.NotBlank(message = "email e obrigatorio.")
    @Email(message = "email deve ter um formato valido.")
    @Size(max = 120, message = "email deve ter no maximo 120 caracteres.")
    private String email;

    @Schema(description = "Senha do usuario", example = "Oficina@123")
    @jakarta.validation.constraints.NotBlank(message = "password e obrigatoria.")
    @Size(min = 8, max = 72, message = "password deve ter entre 8 e 72 caracteres.")
    private String password;
}
