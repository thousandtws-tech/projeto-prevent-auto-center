package br.com.tws.mscustomers.validation.util;

public final class TextUtils {

    private TextUtils() {
    }

    public static String normalizeWhitespace(String value) {
        return value == null ? null : value.trim().replaceAll("\\s+", " ");
    }
}
