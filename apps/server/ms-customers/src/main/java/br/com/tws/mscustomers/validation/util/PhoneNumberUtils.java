package br.com.tws.mscustomers.validation.util;

public final class PhoneNumberUtils {

    private PhoneNumberUtils() {
    }

    public static boolean isValid(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String trimmed = value.trim();
        if (!trimmed.matches("^[0-9()\\-+\\s]+$")) {
            return false;
        }

        String digits = normalize(trimmed);
        return digits.length() >= 10 && digits.length() <= 13;
    }

    public static String normalize(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }
}
