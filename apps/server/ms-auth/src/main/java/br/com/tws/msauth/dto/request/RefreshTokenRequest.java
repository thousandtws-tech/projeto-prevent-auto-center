package br.com.tws.msauth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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
public class RefreshTokenRequest {

    @Schema(description = "Refresh token opaco emitido pelo login", example = "u45nV9E7...")
    @NotBlank(message = "refreshToken e obrigatorio.")
    private String refreshToken;
}
