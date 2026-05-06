package br.com.tws.msserviceorders.exception;

public class ServiceOrderCatalogItemNotFoundException extends ResourceNotFoundException {

    public ServiceOrderCatalogItemNotFoundException(Long id) {
        super("Item de catalogo da ordem de servico nao encontrado para o id " + id + ".");
    }
}
