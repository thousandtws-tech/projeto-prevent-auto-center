package br.com.tws.mscustomers.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleUpdateRequest {
    @Schema(description = "Modelo do veiculo", example = "Onix Plus")
    @NotBlank(message = "modelo é obrigatório.")
    @Size(min = 2, max = 60, message = "modelo deve ter entre 2 e 60 caracteres.")
    private String model;

    @Schema(description = "Marca do veiculo", example = "Chevrolet")
    @NotBlank(message = "marca é obrigatória.")
    @Size(min = 2, max = 40, message = "marca deve ter entre 2 e 40 caracteres.")
    private String brand;

    @Schema(description = "Placa do veiculo", example = "ABC1D23")
    @NotBlank(message = "placa é obrigatória.")
    private String plate;

    @Schema(description = "Numero do chassi", example = "9BWZZZ377VT004251")
    @NotBlank(message = "chassi é obrigatório.")
    @Size(min = 17, max = 17, message = "chassi deve ter 17 caracteres.")
    private String chassisNumber;

    @Schema(description = "Quilometragem atual do veiculo", example = "20000")
    @NotNull(message = "quilometragem é obrigatória.")
    @PositiveOrZero(message = "quilometragem deve ser maior ou igual a 0.")
    private Long mileage;

    @Schema(description = "Ano do veiculo", example = "2022")
    @NotNull(message = "ano é obrigatório.")
    @Min(value = 1900, message = "ano deve ser maior ou igual a 1900.")
    @Max(value = 2999, message = "ano deve ser menor ou igual a 2999.")
    private Long year;

    @Schema(description = "Cor do veiculo", example = "Prata")
    @Size(min = 3, max = 30, message = "cor deve ter entre 3 e 30 caracteres.")
    private String color;
}
