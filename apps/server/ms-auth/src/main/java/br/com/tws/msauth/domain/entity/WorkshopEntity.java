package br.com.tws.msauth.domain.entity;

import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Builder(toBuilder = true)
@Table("workshops")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class WorkshopEntity {

    @Id
    private Long id;

    private String name;
    private String slug;
    @Column("logo_url")
    private String logoUrl;
    @Column("sidebar_image_url")
    private String sidebarImageUrl;
    private Boolean active;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
