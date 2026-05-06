package br.com.tws.mscustomers.domain.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Builder(toBuilder = true)
@Table("vehicles")
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
public class VehicleEntity {

    @Id
    Long id;

    @Column("workshop_id")
    Long workshopId;

    @NotBlank
    @Column("modelo")
    String model;

    @NotBlank
    @Column("marca")
    String brand;

    @NotBlank
    @Column("placa")
    String plate;

    @NotBlank
    @Column("chassi")
    String chassisNumber;

    @NotNull
    @Column("quilometragem")
    Long mileage;

    @NotNull
    @Column("ano")
    Long year;

    @Column("cor")
    String color;
}
