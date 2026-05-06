package br.com.tws.msbackup.exception;

public class BackupRunNotFoundException extends RuntimeException {

    public BackupRunNotFoundException(Long id) {
        super("Backup nao encontrado para o identificador " + id + ".");
    }
}
