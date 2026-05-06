# Docker (server)

## Pré-requisitos

- Docker + Docker Compose
- (Para publicar) acesso ao registry (ex.: Docker Hub) + `docker login`

## Variáveis (.env)

Crie um arquivo `infra/docker/.env`:

```bash
cp infra/docker/.env.example infra/docker/.env
```

Ajuste `IMAGE_PREFIX`, `IMAGE_TAG` e `MODULE` conforme necessário.

## Build (local)

Pelo Makefile:

```bash
make -C infra/docker build
```

Ou via compose:

```bash
docker compose --env-file infra/docker/.env -f infra/docker/docker-compose.yml build prevent-monolith
```

## Publish (push)

Multi-arch com buildx (recomendado):

```bash
docker login
make -C infra/docker buildx-push
```

Alternativa (script):

```bash
docker login
bash infra/docker/publish.sh
```
