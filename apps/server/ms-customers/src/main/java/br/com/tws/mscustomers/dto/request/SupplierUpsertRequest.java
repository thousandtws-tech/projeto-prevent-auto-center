package br.com.tws.mscustomers.dto.request;

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
public class SupplierUpsertRequest {

    @NotBlank(message = "name é obrigatorio.")
    @Size(max = 160, message = "name deve ter no maximo 160 caracteres.")
    private String name;

    @Size(max = 20, message = "document deve ter no maximo 20 caracteres.")
    private String document;

    @Size(max = 120, message = "contactName deve ter no maximo 120 caracteres.")
    private String contactName;

    @Size(max = 40, message = "phone deve ter no maximo 40 caracteres.")
    private String phone;

    @Email(message = "email deve ser valido.")
    @Size(max = 160, message = "email deve ter no maximo 160 caracteres.")
    private String email;

    @Size(max = 80, message = "category deve ter no maximo 80 caracteres.")
    private String category;

    @Size(max = 255, message = "address deve ter no maximo 255 caracteres.")
    private String address;

    private String notes;

    @Size(max = 20, message = "status deve ter no maximo 20 caracteres.")
    private String status;
}
