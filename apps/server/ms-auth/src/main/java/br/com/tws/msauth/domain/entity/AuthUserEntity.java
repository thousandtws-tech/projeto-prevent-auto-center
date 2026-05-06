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
@Table("auth_users")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AuthUserEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    @Column("full_name")
    private String fullName;

    private String email;

    @Column("password_hash")
    private String passwordHash;

    private String role;
    @Column("profile_photo_url")
    private String profilePhotoUrl;
    private Boolean active;

    @Column("email_verified_at")
    private OffsetDateTime emailVerifiedAt;

    @Column("verification_email_sent_at")
    private OffsetDateTime verificationEmailSentAt;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
