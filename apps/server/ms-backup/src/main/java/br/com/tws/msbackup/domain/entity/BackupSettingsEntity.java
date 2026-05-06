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
@Table("backup_settings")
public class BackupSettingsEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    @Column("automatic_enabled")
    private Boolean automaticEnabled;

    @Column("schedule_days")
    private String scheduleDays;

    @Column("schedule_time")
    private String scheduleTime;

    private String timezone;

    @Column("last_automatic_execution_at")
    private OffsetDateTime lastAutomaticExecutionAt;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
