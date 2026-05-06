package br.com.tws.msauth.domain.model;

import br.com.tws.msauth.domain.entity.AuthUserEntity;
import br.com.tws.msauth.domain.entity.WorkshopEntity;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CurrentSession {

    WorkshopEntity workshop;
    AuthUserEntity user;
}
