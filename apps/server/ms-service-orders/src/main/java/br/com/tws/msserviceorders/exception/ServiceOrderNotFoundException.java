package br.com.tws.msserviceorders.exception;

public class ServiceOrderNotFoundException extends ResourceNotFoundException {

    public ServiceOrderNotFoundException(Long id) {
        super("Ordem de servico nao encontrada para o id " + id + ".");
    }
}
