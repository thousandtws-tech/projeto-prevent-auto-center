package br.com.tws.msauth.exception;

public class WorkshopAlreadyExistsException extends ConflictException {

    public WorkshopAlreadyExistsException() {
        super("Ja existe oficina com slug informado.");
    }
}
