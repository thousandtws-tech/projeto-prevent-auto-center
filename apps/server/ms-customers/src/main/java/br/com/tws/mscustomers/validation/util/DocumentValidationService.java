package br.com.tws.mscustomers.validation.util;

import br.com.tws.mscustomers.validation.strategy.CnpjValidationStrategy;
import br.com.tws.mscustomers.validation.strategy.CpfValidationStrategy;
import br.com.tws.mscustomers.validation.strategy.DocumentValidationStrategy;
import java.util.List;

public class DocumentValidationService {

    private final List<DocumentValidationStrategy> strategies;

    public DocumentValidationService() {
        this(List.of(new CpfValidationStrategy(), new CnpjValidationStrategy()));
    }

    public DocumentValidationService(List<DocumentValidationStrategy> strategies) {
        this.strategies = List.copyOf(strategies);
    }

    public boolean isValid(String value) {
        String normalized = DocumentUtils.normalize(value);
        return strategies.stream()
                .filter(strategy -> strategy.supports(normalized))
                .findFirst()
                .map(strategy -> strategy.isValid(normalized))
                .orElse(false);
    }
}
