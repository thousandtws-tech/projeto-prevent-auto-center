package br.com.tws.mscustomers.validation.util;

public final class DocumentUtils {

    private DocumentUtils() {
    }

    public static String normalize(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }
}
