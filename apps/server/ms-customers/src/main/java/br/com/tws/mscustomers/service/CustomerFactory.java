package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.model.CustomerCommand;
import java.time.Clock;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomerFactory {

    private final Clock clock;

    public CustomerEntity create(Long workshopId, CustomerCommand command) {
        OffsetDateTime now = OffsetDateTime.now(clock);

        return CustomerEntity.builder()
                .workshopId(workshopId)
                .nomeCompleto(command.nomeCompleto())
                .telefone(command.telefone())
                .cpfCnpj(command.cpfCnpj())
                .email(command.email())
                .dataNascimento(command.dataNascimento())
                .endereco(command.endereco())
                .cep(command.cep())
                .logradouro(command.logradouro())
                .numero(command.numero())
                .complemento(command.complemento())
                .bairro(command.bairro())
                .cidade(command.cidade())
                .uf(command.uf())
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    public CustomerEntity update(CustomerEntity existing, CustomerCommand command) {
        return existing.toBuilder()
                .nomeCompleto(command.nomeCompleto())
                .telefone(command.telefone())
                .cpfCnpj(command.cpfCnpj())
                .email(command.email())
                .dataNascimento(command.dataNascimento())
                .endereco(command.endereco())
                .cep(command.cep())
                .logradouro(command.logradouro())
                .numero(command.numero())
                .complemento(command.complemento())
                .bairro(command.bairro())
                .cidade(command.cidade())
                .uf(command.uf())
                .updatedAt(OffsetDateTime.now(clock))
                .build();
    }
}
