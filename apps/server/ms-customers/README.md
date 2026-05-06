# ms-customers

Implementação API REST reativa multi-tenant para cadastro de clientes e veículos usando Spring Boot WebFlux, R2DBC e PostgreSQL 17.

## Estrutura

```text
src
|- main
|  |- java/br/com/tws/mscustomers
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
|  |  |- service
|  |  `- validation
|  `- resources
|     |- db/migration
|     `- application.properties
`- test
   `- java/br/com/tws/mscustomers
      |- controller
      |- dto
      |- service
      |- support
      `- validation
```

## Endpoints

| Metodo | Endpoint | HTTP | Descricao |
| --- | --- | --- | --- |
| POST | `/customers` | `201 Created` | Cadastra um cliente da oficina autenticada |
| GET | `/customers/{id}` | `200 OK` | Busca cliente por id dentro da oficina autenticada |
| GET | `/customers` | `200 OK` | Lista clientes da oficina autenticada com paginacao, ordenacao e filtros |
| PUT | `/customers/{id}` | `200 OK` | Atualiza um cliente da oficina autenticada |
| DELETE | `/customers/{id}` | `204 No Content` | Remove um cliente da oficina autenticada |
| POST | `/mechanics` | `201 Created` | Cadastra um mecanico responsavel para a oficina autenticada |
| GET | `/mechanics/{id}` | `200 OK` | Busca mecanico por id dentro da oficina autenticada |
| GET | `/mechanics` | `200 OK` | Lista mecanicos da oficina autenticada com paginacao, ordenacao e filtros |
| PATCH | `/mechanics/{id}` | `200 OK` | Atualiza um mecanico existente |
| DELETE | `/mechanics/{id}` | `204 No Content` | Remove um mecanico da oficina autenticada |

Filtros suportados em `GET /customers`:

- `page`
- `size`
- `sort=campo,direcao`
- `nomeCompleto`
- `telefone`
- `cpfCnpj`
- `email`

Campos aceitos em `sort`:

- `id`
- `nomeCompleto`
- `telefone`
- `email`
- `createdAt`
- `updatedAt`

## Exemplos

### POST /mechanics

Request:

```json
{
  "name": "Carlos Silva",
  "phone": "(11) 99999-9999",
  "email": "carlos@prevent.com.br",
  "status": "active"
}
```

Response (`201 Created`):

```json
{
  "id": 1,
  "status": "active",
  "name": "Carlos Silva",
  "phone": "(11) 99999-9999",
  "email": "carlos@prevent.com.br",
  "createdAt": "2026-03-28T13:00:00Z",
  "updatedAt": "2026-03-28T13:00:00Z"
}
```

### GET /mechanics

Filtros suportados:

- `page`
- `size`
- `sort=campo,direcao`
- `name`
- `phone`
- `status` (`active` | `inactive`)

Campos aceitos em `sort`:

- `id`
- `name`
- `status`
- `createdAt`
- `updatedAt`

### POST /customers

Request:

```json
{
  "nomeCompleto": "Ana Souza",
  "telefone": "+55 (11) 99876-5432",
  "cpfCnpj": "529.982.247-25",
  "email": "ana.souza@example.com",
  "endereco": "Rua das Flores, 123"
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "nomeCompleto": "Ana Souza",
  "telefone": "5511998765432",
  "cpfCnpj": "52998224725",
  "email": "ana.souza@example.com",
  "endereco": "Rua das Flores, 123",
  "createdAt": "2026-03-06T12:00:00Z",
  "updatedAt": "2026-03-06T12:00:00Z"
}
```

### GET /customers?page=0&size=10&sort=nomeCompleto,asc&nomeCompleto=Ana

Response `200 OK`:

```json
{
  "content": [
    {
      "id": 1,
      "nomeCompleto": "Ana Souza",
      "telefone": "5511998765432",
      "cpfCnpj": "52998224725",
      "email": "ana.souza@example.com",
      "endereco": "Rua das Flores, 123",
      "createdAt": "2026-03-06T12:00:00Z",
      "updatedAt": "2026-03-06T12:00:00Z"
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "sort": "nomeCompleto,asc"
}
```

### PUT /customers/{id}

Request:

```json
{
  "nomeCompleto": "Ana Paula Souza",
  "telefone": "+55 (11) 99999-0000",
  "cpfCnpj": "529.982.247-25",
  "email": "ana.paula@example.com",
  "endereco": "Rua das Flores, 200"
}
```

Response `200 OK`:

```json
{
  "id": 1,
  "nomeCompleto": "Ana Paula Souza",
  "telefone": "5511999990000",
  "cpfCnpj": "52998224725",
  "email": "ana.paula@example.com",
  "endereco": "Rua das Flores, 200",
  "createdAt": "2026-03-06T12:00:00Z",
  "updatedAt": "2026-03-06T12:15:00Z"
}
```

### Erro padrao

Response `400 Bad Request`:

```json
{
  "timestamp": "2026-03-06T12:00:00Z",
  "path": "/customers",
  "status": 400,
  "error": "Bad Request",
  "message": "Erro de validacao na requisicao.",
  "details": [
    {
      "field": "cpfCnpj",
      "message": "cpfCnpj deve ser um CPF ou CNPJ valido."
    }
  ],
  "traceId": "f3f3ec0d-9"
}
```

## Erros de negocio e validacao

- `401 Unauthorized`: token ausente, invalido ou sem `workshopId`.
- `400 Bad Request`: DTO invalido, sort invalido, pagina invalida, path variable invalida.
- `404 Not Found`: cliente nao encontrado.
- `409 Conflict`: email ou cpfCnpj ja cadastrados na mesma oficina.
- `500 Internal Server Error`: falha inesperada.

## Massa de dados de exemplo

```json
[
  {
    "nomeCompleto": "Ana Souza",
    "telefone": "+55 (11) 99876-5432",
    "cpfCnpj": "529.982.247-25",
    "email": "ana.souza@example.com",
    "endereco": "Rua das Flores, 123"
  },
  {
    "nomeCompleto": "Carlos Lima",
    "telefone": "+55 (11) 98888-7777",
    "cpfCnpj": "11.444.777/0001-61",
    "email": "carlos.lima@example.com",
    "endereco": "Av. Brasil, 456"
  }
]
```

## Decisoes arquiteturais

- `CustomerFacadeImpl` aplica Facade para manter o controller fino e encapsular mapeamento + orquestracao.
- `CustomerValidationChain` aplica Chain of Responsibility para encadear validacoes de duplicidade sem acoplar regras no servico.
- `DocumentValidationService` + `CpfValidationStrategy` + `CnpjValidationStrategy` aplicam Strategy para validar CPF e CNPJ com algoritmos distintos.
- `CustomerFactory` centraliza a criacao/atualizacao da entidade e timestamps, evitando duplicacao de regras.
- `CustomerSearchRepositoryImpl` usa SQL reativo com `DatabaseClient` para paginacao real com filtros, ordenacao segura e isolamento por `workshop_id`.

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

## Testes

```bash
cd apps/server/ms-customers
./mvnw test
```

Os testes de integracao usam Testcontainers com `postgres:17-alpine`.
