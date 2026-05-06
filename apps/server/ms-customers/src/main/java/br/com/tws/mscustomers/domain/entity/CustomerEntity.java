package br.com.tws.mscustomers.domain.entity;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Table("customers")
public class CustomerEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    @Column("nome_completo")
    private String nomeCompleto;

    @Column("telefone")
    private String telefone;

    @Column("cpf_cnpj")
    private String cpfCnpj;

    @Column("email")
    private String email;

    @Column("data_nascimento")
    private LocalDate dataNascimento;

    @Column("endereco")
    private String endereco;

    @Column("cep")
    private String cep;

    @Column("logradouro")
    private String logradouro;

    @Column("numero")
    private String numero;

    @Column("complemento")
    private String complemento;

    @Column("bairro")
    private String bairro;

    @Column("cidade")
    private String cidade;

    @Column("uf")
    private String uf;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
