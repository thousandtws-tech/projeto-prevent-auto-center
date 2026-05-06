package br.com.tws.mscustomers.validation.strategy;

public class CnpjValidationStrategy implements DocumentValidationStrategy {

    private static final int[] FIRST_WEIGHTS = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] SECOND_WEIGHTS = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

    @Override
    public boolean supports(String normalizedDocument) {
        return normalizedDocument != null && normalizedDocument.length() == 14;
    }

    @Override
    public boolean isValid(String normalizedDocument) {
        if (normalizedDocument == null || normalizedDocument.chars().distinct().count() == 1) {
            return false;
        }

        int firstDigit = calculateDigit(normalizedDocument, FIRST_WEIGHTS);
        int secondDigit = calculateDigit(normalizedDocument.substring(0, 12) + firstDigit, SECOND_WEIGHTS);

        return normalizedDocument.charAt(12) == Character.forDigit(firstDigit, 10)
                && normalizedDocument.charAt(13) == Character.forDigit(secondDigit, 10);
    }

    private int calculateDigit(String value, int[] weights) {
        int sum = 0;
        for (int index = 0; index < weights.length; index++) {
            sum += Character.getNumericValue(value.charAt(index)) * weights[index];
        }

        int result = sum % 11;
        return result < 2 ? 0 : 11 - result;
    }
}
