package br.com.tws.msbackup.service;

import java.time.DayOfWeek;
import java.util.List;

public record BackupScheduleDefinition(
        List<DayOfWeek> daysOfWeek,
        String scheduleDays,
        String scheduleTime,
        String timezone
) {
}
