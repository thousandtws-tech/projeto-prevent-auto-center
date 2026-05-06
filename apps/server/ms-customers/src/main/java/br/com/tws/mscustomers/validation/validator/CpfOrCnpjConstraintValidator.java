package br.com.tws.mscustomers.validation.validator;

import br.com.tws.mscustomers.validation.annotation.CpfOrCnpj;
import br.com.tws.mscustomers.validation.util.DocumentValidationService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CpfOrCnpjConstraintValidator implements ConstraintValidator<CpfOrCnpj, String> {

    private final DocumentValidationService documentValidationService = new DocumentValidationService();

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.isBlank() || documentValidationService.isValid(value);
    }
}
