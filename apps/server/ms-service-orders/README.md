# ms-service-orders

Implementacao API REST reativa multi-tenant para cadastro, consulta, compartilhamento e assinatura de ordens de servico usando Spring Boot WebFlux, R2DBC e PostgreSQL 17.

## Estrutura

```text
src
|- main
|  |- java/br/com/tws/msserviceorders
|  |  |- config
|  |  |- controller
|  |  |- domain
|  |  |  |- entity
|  |  |  `- model
|  |  |- dto
|  |  |  |- request
|  |  |  `- response
|  |  |- exception
|  |  |- mapper
|  |  |- repository
|  |  |- security
|  |  `- service
|  `- resources
|     |- db/migration
|     `- application.properties
`- test
   `- java/br/com/tws/msserviceorders
```

## Endpoints

| Metodo | Endpoint | HTTP | Descricao |
| --- | --- | --- | --- |
| POST | `/service-orders` | `201 Created` | Cadastra uma ordem de servico da oficina autenticada |
| GET | `/service-orders/{id}` | `200 OK` | Busca uma ordem de servico por id dentro da oficina autenticada |
| GET | `/service-orders` | `200 OK` | Lista ordens de servico com paginacao, ordenacao e filtros |
| PATCH | `/service-orders/{id}` | `200 OK` | Atualiza uma ordem de servico existente |
| DELETE | `/service-orders/{id}` | `204 No Content` | Remove uma ordem de servico da oficina autenticada |
| POST | `/service-orders/{id}/share` | `200 OK` | Gera ou recupera o link publico de assinatura |
| GET | `/service-orders/shared/{token}` | `200 OK` | Consulta publica da ordem compartilhada por token |
| POST | `/service-orders/shared/{token}/sign` | `200 OK` | Registra a assinatura publica da ordem compartilhada |

### Autenticacao

- Endpoints privados exigem JWT Bearer com `workshopId` no token.
- Endpoints publicos:
  - `GET /service-orders/shared/{token}`
  - `POST /service-orders/shared/{token}/sign`

## Filtros suportados em `GET /service-orders`

- `page`
- `size`
- `sort=campo,direcao`
- `status`
- `orderNumber`
- `customerName`
- `signatureStatus`

Campos aceitos em `sort`:

- `id`
- `orderNumber`
- `customerName`
- `status`
- `createdAt`
- `updatedAt`

Status aceitos:

- Ordem: `registered`, `sent_for_signature`, `signed`
- Assinatura: `pending`, `signed`
- Itens e servicos: `approved`, `declined`

## Exemplos

### POST /service-orders

Request:

```json
{
  "orderInfo": {
    "orderNumber": "OS-2026-001",
    "date": "2026-03-09",
    "customerName": "Andre Cordeiro",
    "phone": "(62) 99664-8484",
    "vehicle": "Duster 1.6 16V",
    "year": "2018",
    "plate": "QQI5D93",
    "km": "86277",
    "mechanicResponsible": "Carlos Silva",
    "paymentMethod": "PIX",
    "notes": "Cliente autorizou contato por WhatsApp."
  },
  "checklist": {
    "oil": true,
    "brakes": true,
    "tires": false
  },
  "parts": [
    {
      "id": "part-1",
      "description": "Filtro de oleo OC1225",
      "quantity": 1,
      "unitPrice": 40.0,
      "status": "approved"
    }
  ],
  "laborServices": [
    {
      "id": "labor-1",
      "description": "Troca de oleo",
      "amount": 80.0,
      "status": "approved"
    }
  ],
  "thirdPartyServices": [
    {
      "id": "third-1",
      "description": "Alinhamento",
      "amount": 90.0,
      "status": "approved"
    }
  ],
  "discount": 10.0,
  "totals": {
    "partsSubtotal": 40.0,
    "laborSubtotal": 80.0,
    "thirdPartySubtotal": 90.0,
    "grandTotal": 200.0
  }
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "createdAt": "2026-03-09T13:00:00Z",
  "updatedAt": "2026-03-09T13:00:00Z",
  "status": "registered",
  "orderInfo": {
    "orderNumber": "OS-2026-001",
    "date": "2026-03-09",
    "customerName": "Andre Cordeiro",
    "phone": "(62) 99664-8484",
    "vehicle": "Duster 1.6 16V",
    "year": "2018",
    "plate": "QQI5D93",
    "km": "86277",
    "mechanicResponsible": "Carlos Silva",
    "paymentMethod": "PIX",
    "notes": "Cliente autorizou contato por WhatsApp."
  },
  "checklist": {
    "oil": true,
    "brakes": true,
    "tires": false
  },
  "parts": [
    {
      "id": "part-1",
      "description": "Filtro de oleo OC1225",
      "quantity": 1,
      "unitPrice": 40.0,
      "status": "approved"
    }
  ],
  "laborServices": [
    {
      "id": "labor-1",
      "description": "Troca de oleo",
      "amount": 80.0,
      "status": "approved"
    }
  ],
  "thirdPartyServices": [
    {
      "id": "third-1",
      "description": "Alinhamento",
      "amount": 90.0,
      "status": "approved"
    }
  ],
  "discount": 10.0,
  "totals": {
    "partsSubtotal": 40.0,
    "laborSubtotal": 80.0,
    "thirdPartySubtotal": 90.0,
    "grandTotal": 200.0
  },
  "signature": null
}
```

### GET /service-orders?page=0&size=10&sort=createdAt,desc&status=registered

Response `200 OK`:

```json
{
  "content": [
    {
      "id": 1,
      "createdAt": "2026-03-09T13:00:00Z",
      "updatedAt": "2026-03-09T13:00:00Z",
      "status": "registered",
      "orderInfo": {
        "orderNumber": "OS-2026-001",
        "date": "2026-03-09",
        "customerName": "Andre Cordeiro",
        "phone": "(62) 99664-8484",
        "vehicle": "Duster 1.6 16V",
        "year": "2018",
        "plate": "QQI5D93",
        "km": "86277",
        "mechanicResponsible": "Carlos Silva",
        "paymentMethod": "PIX",
        "notes": "Cliente autorizou contato por WhatsApp."
      },
      "checklist": {
        "oil": true,
        "brakes": true,
        "tires": false
      },
      "parts": [],
      "laborServices": [],
      "thirdPartyServices": [],
      "discount": 0.0,
      "totals": {
        "partsSubtotal": 0.0,
        "laborSubtotal": 0.0,
        "thirdPartySubtotal": 0.0,
        "grandTotal": 0.0
      },
      "signature": null
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "sort": "createdAt,desc"
}
```

### POST /service-orders/{id}/share

Response `200 OK`:

```json
{
  "serviceOrderId": 1,
  "token": "7db6d2d6-5105-4a6e-9807-9f53ce2ababa",
  "link": "http://localhost:5173/assinatura-os/7db6d2d6-5105-4a6e-9807-9f53ce2ababa",
  "status": "pending"
}
```

### POST /service-orders/shared/{token}/sign

Request:

```json
{
  "signerName": "Andre Cordeiro",
  "parts": [
    {
      "id": "part-1",
      "description": "Filtro de oleo OC1225",
      "quantity": 1,
      "unitPrice": 40.0,
      "status": "approved"
    },
    {
      "id": "part-2",
      "description": "Terminal de direcao",
      "quantity": 1,
      "unitPrice": 145.0,
      "status": "declined"
    }
  ],
  "laborServices": [
    {
      "id": "labor-1",
      "description": "Troca de oleo",
      "amount": 80.0,
      "status": "approved"
    }
  ],
  "thirdPartyServices": [],
  "totals": {
    "partsSubtotal": 40.0,
    "laborSubtotal": 80.0,
    "thirdPartySubtotal": 0.0,
    "grandTotal": 120.0
  }
}
```

Response `200 OK`:

```json
{
  "token": "7db6d2d6-5105-4a6e-9807-9f53ce2ababa",
  "createdAt": "2026-03-09T13:00:00Z",
  "status": "signed",
  "orderInfo": {
    "orderNumber": "OS-2026-001",
    "date": "2026-03-09",
    "customerName": "Andre Cordeiro",
    "phone": "(62) 99664-8484",
    "vehicle": "Duster 1.6 16V",
    "year": "2018",
    "plate": "QQI5D93",
    "km": "86277",
    "mechanicResponsible": "Carlos Silva",
    "paymentMethod": "PIX",
    "notes": "Cliente autorizou contato por WhatsApp."
  },
  "checklist": {
    "oil": true,
    "brakes": true,
    "tires": false
  },
  "parts": [
    {
      "id": "part-1",
      "description": "Filtro de oleo OC1225",
      "quantity": 1,
      "unitPrice": 40.0,
      "status": "approved"
    },
    {
      "id": "part-2",
      "description": "Terminal de direcao",
      "quantity": 1,
      "unitPrice": 145.0,
      "status": "declined"
    }
  ],
  "laborServices": [
    {
      "id": "labor-1",
      "description": "Troca de oleo",
      "amount": 80.0,
      "status": "approved"
    }
  ],
  "thirdPartyServices": [],
  "discount": 10.0,
  "totals": {
    "partsSubtotal": 40.0,
    "laborSubtotal": 80.0,
    "thirdPartySubtotal": 0.0,
    "grandTotal": 120.0
  },
  "signature": {
    "name": "Andre Cordeiro",
    "signedAt": "2026-03-09T13:30:00Z"
  }
}
```

### Erro padrao

Response `400 Bad Request`:

```json
{
  "timestamp": "2026-03-09T13:00:00Z",
  "path": "/service-orders",
  "status": 400,
  "error": "Bad Request",
  "message": "Erro de validacao na requisicao.",
  "details": [
    {
      "field": "orderInfo.orderNumber",
      "message": "orderInfo.orderNumber e obrigatorio."
    }
  ],
  "traceId": "0c2c5d5e8f"
}
```

## Erros de negocio e validacao

- `401 Unauthorized`: token ausente, invalido ou sem `workshopId`.
- `403 Forbidden`: usuario autenticado sem permissao.
- `400 Bad Request`: DTO invalido, `sort` invalido, pagina invalida ou data de assinatura invalida.
- `404 Not Found`: ordem ou token compartilhado nao encontrado.
- `409 Conflict`: ordem compartilhada ja assinada.
- `500 Internal Server Error`: falha inesperada.

## Decisoes arquiteturais

- `ServiceOrderFacadeImpl` aplica Facade para manter o controller fino e centralizar a resolucao do contexto da oficina autenticada.
- `ServiceOrderMapper` concentra normalizacao, serializacao do payload JSON e mapeamento entre DTOs, entidade e resposta publica.
- `ServiceOrderSearchRepositoryImpl` usa SQL reativo com `DatabaseClient` para paginacao real, filtros opcionais, ordenacao segura e isolamento por `workshop_id`.
- O payload detalhado da ordem e persistido em `payload_json`, enquanto colunas dedicadas mantem os indices de busca e assinatura.
- `SecurityConfiguration` protege os endpoints privados com JWT e libera apenas os endpoints publicos de compartilhamento e assinatura.

## Como rodar localmente

1. Suba o backend monolítico:

```bash
cd apps/server
./mvnw -pl prevent-monolith -am spring-boot:run
```

2. Ou suba via Docker Compose:

```bash
cd infra/docker
docker compose up -d prevent-monolith
```

### Variaveis uteis

- `SERVER_PORT` default `8083`
- `DB_SCHEMA` default `ms_service_orders`
- `SERVICE_ORDERS_PUBLIC_SIGNATURE_BASE_URL` default `http://localhost:5173/assinatura-os`
- `AUTH_JWT_SECRET` segredo usado para validar o JWT HS256

## Testes

```bash
cd apps/server/ms-service-orders
./mvnw test
```

Atualmente o modulo possui teste basico de carregamento de contexto Spring.
