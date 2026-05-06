package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.dto.request.MechanicSearchRequest;
import br.com.tws.mscustomers.dto.request.MechanicUpsertRequest;
import br.com.tws.mscustomers.dto.response.MechanicResponse;
import br.com.tws.mscustomers.dto.response.PageResponse;
import reactor.core.publisher.Mono;

public interface MechanicFacade {

    Mono<MechanicResponse> create(MechanicUpsertRequest request);

    Mono<MechanicResponse> getById(Long id);

    Mono<PageResponse<MechanicResponse>> list(MechanicSearchRequest request);

    Mono<MechanicResponse> update(Long id, MechanicUpsertRequest request);

    Mono<Void> delete(Long id);
}

