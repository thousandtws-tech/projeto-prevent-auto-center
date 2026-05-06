package br.com.tws.mscustomers.domain.entity;

import java.time.OffsetDateTime;
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
@Table("suppliers")
public class SupplierEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    private String name;

    private String document;

    @Column("contact_name")
    private String contactName;

    private String phone;

    private String email;

    private String category;

    private String address;

    private String notes;

    private String status;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
