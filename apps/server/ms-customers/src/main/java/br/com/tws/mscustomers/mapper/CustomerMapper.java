package br.com.tws.mscustomers.mapper;

import br.com.tws.mscustomers.domain.entity.CustomerEntity;
import br.com.tws.mscustomers.domain.model.CustomerCommand;
import br.com.tws.mscustomers.domain.model.CustomerSearchCriteria;
import br.com.tws.mscustomers.domain.model.CustomerSortField;
import br.com.tws.mscustomers.domain.model.PageQuery;
import br.com.tws.mscustomers.domain.model.PageResult;
import br.com.tws.mscustomers.dto.request.CustomerSearchRequest;
import br.com.tws.mscustomers.dto.request.CustomerWriteRequest;
import br.com.tws.mscustomers.dto.response.CustomerResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.exception.BadRequestException;
import br.com.tws.mscustomers.validation.util.DocumentUtils;
import br.com.tws.mscustomers.validation.util.PhoneNumberUtils;
import br.com.tws.mscustomers.validation.util.TextUtils;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class CustomerMapper {

    public CustomerCommand toCommand(CustomerWriteRequest request) {
        String cep = normalizeNullableCep(request.getCep());
        String logradouro = normalizeNullableText(request.getLogradouro());
        String numero = normalizeNullableText(request.getNumero());
        String complemento = normalizeNullableText(request.getComplemento());
        String bairro = normalizeNullableText(request.getBairro());
        String cidade = normalizeNullableText(request.getCidade());
        String uf = normalizeNullableUf(request.getUf());
        String endereco = buildEndereco(
                request.getEndereco(),
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                cep
        );

        return CustomerCommand.builder()
                .nomeCompleto(TextUtils.normalizeWhitespace(request.getNomeCompleto()))
                .telefone(PhoneNumberUtils.normalize(request.getTelefone()))
                .cpfCnpj(DocumentUtils.normalize(request.getCpfCnpj()))
                .email(normalizeEmail(request.getEmail()))
                .dataNascimento(parseBirthDate(request.getDataNascimento()))
                .endereco(endereco)
                .cep(cep)
                .logradouro(logradouro)
                .numero(numero)
                .complemento(complemento)
                .bairro(bairro)
                .cidade(cidade)
                .uf(uf)
                .build();
    }

    public CustomerSearchCriteria toSearchCriteria(CustomerSearchRequest request) {
        return CustomerSearchCriteria.builder()
                .nomeCompleto(normalizeNullableText(request.getNomeCompleto()))
                .telefone(normalizeNullablePhone(request.getTelefone()))
                .cpfCnpj(normalizeNullableDocument(request.getCpfCnpj()))
                .email(normalizeNullableEmail(request.getEmail()))
                .build();
    }

    public PageQuery toPageQuery(CustomerSearchRequest request) {
        String sortExpression = StringUtils.hasText(request.getSort())
                ? request.getSort().trim()
                : "createdAt,desc";

        String[] tokens = sortExpression.split(",");
        if (tokens.length != 2) {
            throw new BadRequestException("Parametro sort invalido. Use o formato campo,direcao.");
        }

        CustomerSortField sortField = CustomerSortField.fromApiField(tokens[0].trim())
                .orElseThrow(() -> new BadRequestException(
                        "Campo de ordenacao invalido. Valores aceitos: id, nomeCompleto, telefone, email, createdAt, updatedAt."
                ));

        Sort.Direction direction = Sort.Direction.fromOptionalString(tokens[1].trim())
                .orElseThrow(() -> new BadRequestException("Direcao de ordenacao invalida. Use asc ou desc."));

        return PageQuery.builder()
                .page(request.getPage())
                .size(request.getSize())
                .sortField(sortField)
                .direction(direction)
                .build();
    }

    public CustomerResponse toResponse(CustomerEntity entity) {
        return CustomerResponse.builder()
                .id(entity.getId())
                .nomeCompleto(entity.getNomeCompleto())
                .telefone(entity.getTelefone())
                .cpfCnpj(entity.getCpfCnpj())
                .email(entity.getEmail())
                .dataNascimento(entity.getDataNascimento())
                .endereco(entity.getEndereco())
                .cep(entity.getCep())
                .logradouro(entity.getLogradouro())
                .numero(entity.getNumero())
                .complemento(entity.getComplemento())
                .bairro(entity.getBairro())
                .cidade(entity.getCidade())
                .uf(entity.getUf())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public PageResponse<CustomerResponse> toPageResponse(PageResult<CustomerEntity> result) {
        int totalPages = result.getTotalElements() == 0
                ? 0
                : (int) Math.ceil((double) result.getTotalElements() / result.getPageQuery().size());

        return PageResponse.<CustomerResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getPageQuery().page())
                .size(result.getPageQuery().size())
                .totalElements(result.getTotalElements())
                .totalPages(totalPages)
                .sort(result.getPageQuery().sortExpression())
                .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNullableText(String value) {
        return StringUtils.hasText(value) ? TextUtils.normalizeWhitespace(value) : null;
    }

    private String normalizeNullableCep(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String digits = value.replaceAll("\\D", "");
        return digits.isEmpty() ? null : digits;
    }

    private String normalizeNullablePhone(String value) {
        return StringUtils.hasText(value) ? PhoneNumberUtils.normalize(value) : null;
    }

    private String normalizeNullableDocument(String value) {
        return StringUtils.hasText(value) ? DocumentUtils.normalize(value) : null;
    }

    private String normalizeNullableEmail(String value) {
        return StringUtils.hasText(value) ? normalizeEmail(value) : null;
    }

    private LocalDate parseBirthDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException exception) {
            throw new BadRequestException("dataNascimento invalida. Use o formato yyyy-MM-dd.");
        }
    }

    private String normalizeNullableUf(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return TextUtils.normalizeWhitespace(value).toUpperCase(Locale.ROOT);
    }

    private String buildEndereco(
            String endereco,
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String uf,
            String cep
    ) {
        if (
                StringUtils.hasText(logradouro)
                        || StringUtils.hasText(numero)
                        || StringUtils.hasText(complemento)
                        || StringUtils.hasText(bairro)
                        || StringUtils.hasText(cidade)
                        || StringUtils.hasText(uf)
                        || StringUtils.hasText(cep)
        ) {
            ArrayList<String> parts = new ArrayList<>();

            String streetLine = StreamUtils.joinNonBlank(", ", logradouro, numero);
            if (StringUtils.hasText(streetLine)) {
                parts.add(streetLine);
            }

            if (StringUtils.hasText(complemento)) {
                parts.add(complemento);
            }

            if (StringUtils.hasText(bairro)) {
                parts.add(bairro);
            }

            String cityLine = StreamUtils.joinNonBlank(" - ", cidade, uf);
            if (StringUtils.hasText(cityLine)) {
                parts.add(cityLine);
            }

            if (StringUtils.hasText(cep)) {
                parts.add(formatCep(cep));
            }

            return parts.stream()
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(", "));
        }

        return StringUtils.hasText(endereco) ? TextUtils.normalizeWhitespace(endereco) : "";
    }

    private String formatCep(String cep) {
        String digits = cep.replaceAll("\\D", "");
        if (digits.length() == 8) {
            return digits.substring(0, 5) + "-" + digits.substring(5);
        }

        return digits;
    }

    private static final class StreamUtils {
        private StreamUtils() {
        }

        private static String joinNonBlank(String delimiter, String... values) {
            return java.util.Arrays.stream(values)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(delimiter));
        }
    }
}
