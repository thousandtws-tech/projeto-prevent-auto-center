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
@Table("refresh_tokens")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RefreshTokenEntity {

    @Id
    private Long id;

    @Column("user_id")
    private Long userId;

    @Column("token_hash")
    private String tokenHash;

    @Column("expires_at")
    private OffsetDateTime expiresAt;

    @Column("revoked_at")
    private OffsetDateTime revokedAt;

    @Column("created_at")
    private OffsetDateTime createdAt;
}
