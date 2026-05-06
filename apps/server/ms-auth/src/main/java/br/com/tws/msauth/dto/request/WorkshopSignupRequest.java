package br.com.tws.msauth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
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
public class WorkshopSignupRequest {

    @Schema(description = "Nome da oficina. Opcional; quando omitido, o backend gera um nome padrao.", example = "Oficina Centro")
    @Size(max = 120, message = "workshopName deve ter no maximo 120 caracteres.")
    private String workshopName;

    @Schema(description = "Slug unico da oficina. Opcional; quando omitido, o backend gera automaticamente.", example = "oficina-centro")
    @Pattern(
            regexp = "^$|^[a-z0-9]+(?:-[a-z0-9]+)*$",
            message = "workshopSlug deve conter apenas letras minusculas, numeros e hifens."
    )
    @Size(max = 50, message = "workshopSlug deve ter no maximo 50 caracteres.")
    private String workshopSlug;

    @Schema(description = "Nome do usuario proprietario", example = "Ana Souza")
    @jakarta.validation.constraints.NotBlank(message = "ownerName e obrigatorio.")
    @Size(min = 3, max = 120, message = "ownerName deve ter entre 3 e 120 caracteres.")
    private String ownerName;

    @Schema(description = "Email do usuario proprietario", example = "ana@oficinacentro.com")
    @jakarta.validation.constraints.NotBlank(message = "ownerEmail e obrigatorio.")
    @Email(message = "ownerEmail deve ter um formato valido.")
    @Size(max = 120, message = "ownerEmail deve ter no maximo 120 caracteres.")
    private String ownerEmail;

    @Schema(description = "Senha inicial da conta", example = "Oficina@123")
    @jakarta.validation.constraints.NotBlank(message = "ownerPassword e obrigatoria.")
    @Size(min = 8, max = 72, message = "ownerPassword deve ter entre 8 e 72 caracteres.")
    private String ownerPassword;
}
