package br.com.tws.mscustomers.validation.validator;

import br.com.tws.mscustomers.validation.annotation.PhoneNumber;
import br.com.tws.mscustomers.validation.util.PhoneNumberUtils;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneNumberConstraintValidator implements ConstraintValidator<PhoneNumber, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.isBlank() || PhoneNumberUtils.isValid(value);
    }
}
