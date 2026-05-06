package br.com.tws.msscheduling.domain.entity;

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
@Table("scheduling_appointments")
public class SchedulingAppointmentEntity {

    @Id
    private Long id;

    @Column("workshop_id")
    private Long workshopId;

    private String status;

    @Column("customer_id")
    private Long customerId;

    @Column("customer_name")
    private String customerName;

    @Column("customer_phone")
    private String customerPhone;

    @Column("customer_email")
    private String customerEmail;

    @Column("vehicle_model")
    private String vehicleModel;

    @Column("vehicle_plate")
    private String vehiclePlate;

    @Column("service_type")
    private String serviceType;

    @Column("mechanic_responsible")
    private String mechanicResponsible;

    private String notes;

    @Column("start_at")
    private OffsetDateTime startAt;

    @Column("end_at")
    private OffsetDateTime endAt;

    @Column("duration_minutes")
    private Integer durationMinutes;

    private String timezone;

    @Column("integration_provider")
    private String integrationProvider;

    @Column("integration_last_attempt_at")
    private OffsetDateTime integrationLastAttemptAt;

    @Column("integration_last_error")
    private String integrationLastError;

    @Column("integration_event_id")
    private String integrationEventId;

    @Column("integration_event_link")
    private String integrationEventLink;

    @Column("integration_response_message")
    private String integrationResponseMessage;

    @Column("service_order_id")
    private Long serviceOrderId;

    @Column("service_order_number")
    private String serviceOrderNumber;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
