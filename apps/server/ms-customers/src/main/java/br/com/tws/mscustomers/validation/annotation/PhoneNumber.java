package br.com.tws.mscustomers.validation.annotation;

import br.com.tws.mscustomers.validation.validator.PhoneNumberConstraintValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberConstraintValidator.class)
public @interface PhoneNumber {

    String message() default "telefone deve ter um formato valido.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
