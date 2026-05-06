package br.com.tws.mscustomers.exception;

public class VehicleNotFoundException extends ResourceNotFoundException {

    public VehicleNotFoundException(Long id) {
        super("Veiculo com id %d nao encontrado.".formatted(id));
    }
}
