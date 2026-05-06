package br.com.tws.msserviceorders.exception;

public class SharedServiceOrderNotFoundException extends ResourceNotFoundException {

    public SharedServiceOrderNotFoundException(String token) {
        super("Ordem compartilhada nao encontrada para o token " + token + ".");
    }
}
