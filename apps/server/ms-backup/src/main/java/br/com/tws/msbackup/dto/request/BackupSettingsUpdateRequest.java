package br.com.tws.msbackup.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BackupSettingsUpdateRequest(
        @NotNull Boolean automaticEnabled,
        @NotEmpty List<@NotBlank String> daysOfWeek,
        @NotBlank String scheduleTime,
        @NotBlank String timezone
) {
}
