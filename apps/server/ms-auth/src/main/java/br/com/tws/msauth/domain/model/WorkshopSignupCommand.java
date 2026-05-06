package br.com.tws.msauth.domain.model;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class WorkshopSignupCommand {

    String workshopName;
    String workshopSlug;
    String ownerName;
    String ownerEmail;
    String ownerPassword;
}
