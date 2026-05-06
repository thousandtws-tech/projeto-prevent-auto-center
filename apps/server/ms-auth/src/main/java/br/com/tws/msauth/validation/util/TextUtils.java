package br.com.tws.msauth.validation.util;

public final class TextUtils {

    private TextUtils() {
    }

    public static String normalizeWhitespace(String value) {
        if (value == null) {
            return null;
        }

        return value.trim().replaceAll("\\s+", " ");
    }
}
