package br.com.tws.msserviceorders.domain.entity;

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
@Table("service_orders")
public class ServiceOrderEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    private String status;

    @Column("order_number")
    private String orderNumber;

    @Column("customer_name")
    private String customerName;

    @Column("payload_json")
    private String payloadJson;

    @Column("signature_token")
    private String signatureToken;

    @Column("signature_link")
    private String signatureLink;

    @Column("signature_status")
    private String signatureStatus;

    @Column("signer_name")
    private String signerName;

    @Column("signed_at")
    private OffsetDateTime signedAt;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
