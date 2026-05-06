package br.com.tws.mscustomers.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CustomerCreateRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void shouldRejectInvalidPayload() {
        CustomerCreateRequest request = CustomerCreateRequest.builder()
                .nomeCompleto("Ana")
                .telefone("123")
                .cpfCnpj("11111111111")
                .email("email-invalido")
                .endereco("Rua")
                .build();

        Set<String> violatedFields = validator.validate(request).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(java.util.stream.Collectors.toSet());

        assertThat(violatedFields)
                .contains("nomeCompleto", "telefone", "cpfCnpj", "email", "endereco");
    }
}
