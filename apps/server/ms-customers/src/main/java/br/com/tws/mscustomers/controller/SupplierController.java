package br.com.tws.mscustomers.controller;

import br.com.tws.mscustomers.domain.entity.SupplierEntity;
import br.com.tws.mscustomers.dto.request.SupplierUpsertRequest;
import br.com.tws.mscustomers.dto.response.SupplierResponse;
import br.com.tws.mscustomers.exception.BadRequestException;
import br.com.tws.mscustomers.exception.ResourceNotFoundException;
import br.com.tws.mscustomers.repository.SupplierRepository;
import br.com.tws.mscustomers.security.AuthenticatedWorkshopService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/suppliers")
public class SupplierController {

    private final SupplierRepository supplierRepository;
    private final AuthenticatedWorkshopService authenticatedWorkshopService;

    @GetMapping
    public Flux<SupplierResponse> list() {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMapMany(supplierRepository::findAllByWorkshopId)
                .sort(Comparator.comparing(SupplierEntity::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse);
    }

    @GetMapping("/{id}")
    public Mono<SupplierResponse> getById(@PathVariable Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> getRequired(workshopId, id))
                .map(this::toResponse);
    }

    @PostMapping
    public Mono<ResponseEntity<SupplierResponse>> create(@Valid @RequestBody SupplierUpsertRequest request) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> validateDocument(workshopId, request, 0L)
                        .then(supplierRepository.save(toEntity(workshopId, request, now))))
                .map(response -> ResponseEntity.created(URI.create("/suppliers/" + response.getId())).body(toResponse(response)));
    }

    @PutMapping("/{id}")
    public Mono<SupplierResponse> update(@PathVariable Long id, @Valid @RequestBody SupplierUpsertRequest request) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> validateDocument(workshopId, request, id)
                        .then(getRequired(workshopId, id))
                        .map(current -> merge(current, request, now))
                        .flatMap(supplierRepository::save))
                .map(this::toResponse);
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable Long id) {
        return authenticatedWorkshopService.getRequiredWorkshopId()
                .flatMap(workshopId -> getRequired(workshopId, id))
                .flatMap(supplierRepository::delete)
                .thenReturn(ResponseEntity.noContent().build());
    }

    private Mono<SupplierEntity> getRequired(Long workshopId, Long id) {
        return supplierRepository.findByIdAndWorkshopId(id, workshopId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Fornecedor nao encontrado.")));
    }

    private Mono<Void> validateDocument(Long workshopId, SupplierUpsertRequest request, Long id) {
        String document = normalizeNullableText(request.getDocument());
        if (!StringUtils.hasText(document)) {
            return Mono.empty();
        }
        return supplierRepository.existsByWorkshopIdAndDocumentAndIdNot(workshopId, document, id)
                .flatMap(exists -> exists
                        ? Mono.error(new BadRequestException("Ja existe fornecedor com este documento."))
                        : Mono.empty());
    }

    private SupplierEntity toEntity(Long workshopId, SupplierUpsertRequest request, OffsetDateTime now) {
        return SupplierEntity.builder()
                .workshopId(workshopId)
                .name(normalizeText(request.getName()))
                .document(normalizeNullableText(request.getDocument()))
                .contactName(normalizeNullableText(request.getContactName()))
                .phone(normalizeNullableText(request.getPhone()))
                .email(normalizeNullableText(request.getEmail()))
                .category(normalizeNullableText(request.getCategory()))
                .address(normalizeNullableText(request.getAddress()))
                .notes(normalizeNullableText(request.getNotes()))
                .status(normalizeStatus(request.getStatus()))
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private SupplierEntity merge(SupplierEntity current, SupplierUpsertRequest request, OffsetDateTime now) {
        return current.toBuilder()
                .name(normalizeText(request.getName()))
                .document(normalizeNullableText(request.getDocument()))
                .contactName(normalizeNullableText(request.getContactName()))
                .phone(normalizeNullableText(request.getPhone()))
                .email(normalizeNullableText(request.getEmail()))
                .category(normalizeNullableText(request.getCategory()))
                .address(normalizeNullableText(request.getAddress()))
                .notes(normalizeNullableText(request.getNotes()))
                .status(normalizeStatus(request.getStatus()))
                .updatedAt(now)
                .build();
    }

    private SupplierResponse toResponse(SupplierEntity entity) {
        return SupplierResponse.builder()
                .id(entity.getId())
                .name(defaultText(entity.getName()))
                .document(defaultText(entity.getDocument()))
                .contactName(defaultText(entity.getContactName()))
                .phone(defaultText(entity.getPhone()))
                .email(defaultText(entity.getEmail()))
                .category(defaultText(entity.getCategory()))
                .address(defaultText(entity.getAddress()))
                .notes(defaultText(entity.getNotes()))
                .status(normalizeStatus(entity.getStatus()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeNullableText(String value) {
        String normalized = normalizeText(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private String normalizeStatus(String value) {
        return "inactive".equalsIgnoreCase(normalizeNullableText(value)) ? "inactive" : "active";
    }

    private String defaultText(String value) {
        return value == null ? "" : value;
    }
}
