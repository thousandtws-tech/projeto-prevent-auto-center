package br.com.tws.mscustomers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class VehicleDto {
    private Long Id;

    @NotBlank
    private String Model;
    @NotBlank
    private String Brand;
    @NotBlank
    private String Plate;
    @NotBlank
    private String ChassisNumber;
    @NotNull
    private Long Mileage;
    @NotNull
    private Long Year;
    private String Color;
}
