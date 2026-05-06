package br.com.tws.mscustomers.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

@Value
@Builder
@Jacksonized
public class VehicleResponse {
    @Schema(description = "Identificador do veiculo", example = "1")
    Long id;
    @Schema(description = "Modelo do veiculo", example = "Onix")
    String modelo;
    @Schema(description = "Marca do veiculo", example = "Chevrolet")
    String brand;
    @Schema(description = "Placa do veiculo", example = "ABC1D23")
    String plate;
    @Schema(description = "Numero do chassi", example = "9BWZZZ377VT004251")
    String chassiNumber;
    @Schema(description = "Quilometragem atual", example = "15000")
    Long mileage;
    @Schema(description = "Ano do veiculo", example = "2022")
    Long year;
    @Schema(description = "Cor do veiculo", example = "Branco")
    String color;
}
