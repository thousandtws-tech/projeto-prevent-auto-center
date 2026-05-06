package br.com.tws.msbackup.config;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "backup")
public class BackupProperties {

    private String storageBasePath = "./data/backups";
    private String defaultTimezone = "America/Sao_Paulo";
    private String defaultScheduleTime = "02:00";
    private List<String> defaultScheduleDays = List.of(
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY"
    );
}
