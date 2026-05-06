package br.com.tws.mscustomers.domain.model;

import java.time.LocalDate;
import lombok.Builder;

@Builder
public record CustomerCommand(
        String nomeCompleto,
        String telefone,
        String cpfCnpj,
        String email,
        LocalDate dataNascimento,
        String endereco,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf
) {
}
