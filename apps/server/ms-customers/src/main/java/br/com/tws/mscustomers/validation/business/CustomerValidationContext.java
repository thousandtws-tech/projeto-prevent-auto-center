package br.com.tws.mscustomers.validation.business;

import br.com.tws.mscustomers.domain.model.CustomerCommand;

public record CustomerValidationContext(Long workshopId, CustomerCommand command, Long currentCustomerId) {
}
