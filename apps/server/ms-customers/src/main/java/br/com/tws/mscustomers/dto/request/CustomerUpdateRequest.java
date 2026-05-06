package br.com.tws.mscustomers.dto.request;

import br.com.tws.mscustomers.validation.annotation.CpfOrCnpj;
import br.com.tws.mscustomers.validation.annotation.PhoneNumber;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerUpdateRequest implements CustomerWriteRequest {

    @NotBlank(message = "nomeCompleto e obrigatorio.")
    @Size(min = 5, max = 120, message = "nomeCompleto deve ter entre 5 e 120 caracteres.")
    private String nomeCompleto;

    @NotBlank(message = "telefone e obrigatorio.")
    @PhoneNumber
    private String telefone;

    @NotBlank(message = "cpfCnpj e obrigatorio.")
    @CpfOrCnpj
    private String cpfCnpj;

    @NotBlank(message = "email e obrigatorio.")
    @Email(message = "email deve ter um formato valido.")
    @Size(max = 120, message = "email deve ter no maximo 120 caracteres.")
    private String email;

    private String dataNascimento;

    @NotBlank(message = "endereco e obrigatorio.")
    @Size(min = 5, max = 255, message = "endereco deve ter entre 5 e 255 caracteres.")
    private String endereco;

    @Size(max = 8, message = "cep deve ter no maximo 8 caracteres.")
    private String cep;

    @Size(max = 120, message = "logradouro deve ter no maximo 120 caracteres.")
    private String logradouro;

    @Size(max = 20, message = "numero deve ter no maximo 20 caracteres.")
    private String numero;

    @Size(max = 120, message = "complemento deve ter no maximo 120 caracteres.")
    private String complemento;

    @Size(max = 120, message = "bairro deve ter no maximo 120 caracteres.")
    private String bairro;

    @Size(max = 120, message = "cidade deve ter no maximo 120 caracteres.")
    private String cidade;

    @Size(max = 2, message = "uf deve ter no maximo 2 caracteres.")
    private String uf;
}
