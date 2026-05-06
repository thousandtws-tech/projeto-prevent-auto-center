package br.com.tws.mscustomers.service;

import br.com.tws.mscustomers.dto.request.*;
import br.com.tws.mscustomers.dto.response.PageResponse;
import br.com.tws.mscustomers.dto.response.VehicleResponse;
import reactor.core.publisher.Mono;

public interface VehicleFacade {

    Mono<VehicleResponse> create(VehicleCreateRequest request);

    Mono<VehicleResponse> getById(Long id);

    Mono<PageResponse<VehicleResponse>> list(VehicleSearchRequest request);

    Mono<VehicleResponse> update(Long id, VehicleUpdateRequest request);

    Mono<Void> delete(Long id);

}
