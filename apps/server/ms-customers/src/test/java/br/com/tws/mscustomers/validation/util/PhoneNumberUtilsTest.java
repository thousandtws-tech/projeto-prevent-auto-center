package br.com.tws.mscustomers.validation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PhoneNumberUtilsTest {

    @Test
    void shouldAcceptFormattedPhoneNumbers() {
        assertThat(PhoneNumberUtils.isValid("+55 (11) 99876-5432")).isTrue();
        assertThat(PhoneNumberUtils.normalize("+55 (11) 99876-5432")).isEqualTo("5511998765432");
    }

    @Test
    void shouldRejectInvalidPhoneNumbers() {
        assertThat(PhoneNumberUtils.isValid("12345")).isFalse();
        assertThat(PhoneNumberUtils.isValid("telefone-invalido")).isFalse();
    }
}
