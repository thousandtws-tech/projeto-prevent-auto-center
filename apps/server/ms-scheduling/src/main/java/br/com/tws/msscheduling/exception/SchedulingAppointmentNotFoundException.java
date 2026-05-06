package br.com.tws.msscheduling.exception;

public class SchedulingAppointmentNotFoundException extends ResourceNotFoundException {

    public SchedulingAppointmentNotFoundException(Long id) {
        super("Agendamento nao encontrado para o id " + id + ".");
    }
}
