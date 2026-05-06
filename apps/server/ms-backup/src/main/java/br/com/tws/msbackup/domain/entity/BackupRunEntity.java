package br.com.tws.msbackup.domain.entity;

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
@Table("backup_runs")
public class BackupRunEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    @Column("trigger_type")
    private String triggerType;

    private String status;

    @Column("started_at")
    private OffsetDateTime startedAt;

    @Column("completed_at")
    private OffsetDateTime completedAt;

    @Column("scheduled_for")
    private OffsetDateTime scheduledFor;

    @Column("created_by_user_id")
    private Long createdByUserId;

    @Column("file_name")
    private String fileName;

    @Column("file_size_bytes")
    private Long fileSizeBytes;

    @Column("checksum_sha256")
    private String checksumSha256;

    @Column("storage_path")
    private String storagePath;

    @Column("error_message")
    private String errorMessage;
}
