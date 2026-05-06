package br.com.tws.mscustomers.exception;

public class CustomerNotFoundException extends ResourceNotFoundException {

    public CustomerNotFoundException(Long id) {
        super("Cliente com id %d nao encontrado.".formatted(id));
    }
}
