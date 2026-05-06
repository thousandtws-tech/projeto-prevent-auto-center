package br.com.tws.msauth.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class AuthResponse {

    @Schema(description = "Access token JWT", example = "eyJhbGciOiJIUzI1NiJ9...")
    String accessToken;

    @Schema(description = "Refresh token opaco", example = "u45nV9E7...")
    String refreshToken;

    @Schema(description = "Tipo do token", example = "Bearer")
    String tokenType;

    @Schema(description = "Tempo de expiracao do access token em segundos", example = "900")
    long expiresIn;

    WorkshopResponse workshop;
    AuthenticatedUserResponse user;
}
