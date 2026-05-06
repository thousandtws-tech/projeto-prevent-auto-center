package br.com.tws.mscustomers.domain.model;

import lombok.Builder;

@Builder
public record CustomerSearchCriteria(
        String nomeCompleto,
        String telefone,
        String cpfCnpj,
        String email
) {
}
