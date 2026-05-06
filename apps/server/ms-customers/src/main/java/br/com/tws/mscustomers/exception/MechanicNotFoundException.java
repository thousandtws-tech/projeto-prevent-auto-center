package br.com.tws.mscustomers.exception;

public class MechanicNotFoundException extends ResourceNotFoundException {

    public MechanicNotFoundException(Long id) {
        super("Mecanico nao encontrado. Id: " + id);
    }
}

