package br.com.tws.mscustomers.validation.strategy;

public class CpfValidationStrategy implements DocumentValidationStrategy {

    @Override
    public boolean supports(String normalizedDocument) {
        return normalizedDocument != null && normalizedDocument.length() == 11;
    }

    @Override
    public boolean isValid(String normalizedDocument) {
        if (normalizedDocument == null || normalizedDocument.chars().distinct().count() == 1) {
            return false;
        }

        int firstDigit = calculateDigit(normalizedDocument, 9, 10);
        int secondDigit = calculateDigit(normalizedDocument, 10, 11);

        return normalizedDocument.charAt(9) == Character.forDigit(firstDigit, 10)
                && normalizedDocument.charAt(10) == Character.forDigit(secondDigit, 10);
    }

    private int calculateDigit(String value, int length, int weightStart) {
        int sum = 0;
        for (int index = 0; index < length; index++) {
            sum += Character.getNumericValue(value.charAt(index)) * (weightStart - index);
        }

        int result = 11 - (sum % 11);
        return result > 9 ? 0 : result;
    }
}
