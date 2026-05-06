package br.com.tws.msauth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class VerifyEmailCodeRequest {

    @Schema(description = "Identificador do usuario pendente de verificacao", example = "1")
    @NotNull(message = "userId e obrigatorio.")
    private Long userId;

    @Schema(description = "Codigo numerico enviado por e-mail", example = "482913")
    @NotBlank(message = "code e obrigatorio.")
    @Pattern(regexp = "^[0-9]{6}$", message = "code deve conter 6 digitos numericos.")
    private String code;
}
