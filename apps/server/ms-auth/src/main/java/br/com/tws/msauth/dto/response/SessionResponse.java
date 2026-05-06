package br.com.tws.msauth.dto.response;

import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class SessionResponse {

    WorkshopResponse workshop;
    AuthenticatedUserResponse user;
}
