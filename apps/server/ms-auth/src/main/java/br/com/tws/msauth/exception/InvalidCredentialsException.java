package br.com.tws.msauth.exception;

public class InvalidCredentialsException extends UnauthorizedException {

    public InvalidCredentialsException() {
        super("Credenciais invalidas.");
    }
}
