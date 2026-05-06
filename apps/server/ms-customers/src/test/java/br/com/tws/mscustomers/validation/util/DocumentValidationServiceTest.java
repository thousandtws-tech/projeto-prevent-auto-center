package br.com.tws.mscustomers.validation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DocumentValidationServiceTest {

    private final DocumentValidationService documentValidationService = new DocumentValidationService();

    @Test
    void shouldAcceptValidCpf() {
        assertThat(documentValidationService.isValid("529.982.247-25")).isTrue();
    }

    @Test
    void shouldAcceptValidCnpj() {
        assertThat(documentValidationService.isValid("11.444.777/0001-61")).isTrue();
    }

    @Test
    void shouldRejectInvalidDocument() {
        assertThat(documentValidationService.isValid("111.111.111-11")).isFalse();
    }
}
