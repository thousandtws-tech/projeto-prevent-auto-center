package br.com.tws.msauth.domain.model;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LoginCommand {

    String workshopSlug;
    String email;
    String password;
}
