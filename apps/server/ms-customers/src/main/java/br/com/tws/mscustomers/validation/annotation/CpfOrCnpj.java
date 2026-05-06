package br.com.tws.mscustomers.validation.annotation;

import br.com.tws.mscustomers.validation.validator.CpfOrCnpjConstraintValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CpfOrCnpjConstraintValidator.class)
public @interface CpfOrCnpj {

    String message() default "cpfCnpj deve ser um CPF ou CNPJ valido.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
