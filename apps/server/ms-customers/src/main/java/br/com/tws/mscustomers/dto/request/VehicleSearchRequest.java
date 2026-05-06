package br.com.tws.mscustomers.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleSearchRequest {

    @Builder.Default
    @Schema(description = "Pagina da consulta", example = "0", defaultValue = "0")
    @Min(value = 0, message = "page deve ser maior ou igual a 0.")
    private Integer page = 0;

    @Builder.Default
    @Schema(description = "Tamanho da pagina", example = "10", defaultValue = "10")
    @Min(value = 1, message = "size deve ser maior ou igual a 1.")
    @Max(value = 100, message = "size deve ser menor ou igual a 100.")
    private Integer size = 10;

    @Builder.Default
    @Schema(description = "Ordenacao no formato campo,direcao", example = "modelo,asc", defaultValue = "id,desc")
    private String sort = "id,desc";

    @Schema(description = "Filtro por modelo", example = "Onix")
    private String modelo;
    @Schema(description = "Filtro por marca", example = "Chevrolet")
    private String brand;
    @Schema(description = "Filtro por placa", example = "ABC1D23")
    private String plate;
    @Schema(description = "Filtro por chassi", example = "9BWZZZ377VT004251")
    private String chassiNumber;
    @Schema(description = "Filtro por quilometragem", example = "15000")
    private Long mileage;
    @Schema(description = "Filtro por ano", example = "2022")
    private Long year;
    @Schema(description = "Filtro por cor", example = "Branco")
    private String color;
}
