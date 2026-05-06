package br.com.tws.msbackup.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record BackupImportResponse(
        OffsetDateTime restoredAt,
        String sourceWorkshopName,
        int restoredCustomers,
        int restoredVehicles,
        int restoredServiceOrders,
        int restoredCatalogItems,
        int restoredAppointments,
        int updatedUsers,
        int skippedUsers,
        List<String> warnings
) {
}
