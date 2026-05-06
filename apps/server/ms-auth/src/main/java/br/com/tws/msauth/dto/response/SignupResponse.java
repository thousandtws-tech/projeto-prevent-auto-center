package br.com.tws.msauth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class SignupResponse {

    @Schema(description = "Mensagem de retorno para o fluxo de confirmacao")
    String message;

    @Schema(description = "Indica que a conta depende de verificacao por e-mail")
    boolean emailVerificationRequired;

    WorkshopResponse workshop;
    AuthenticatedUserResponse user;
}
