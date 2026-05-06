.PHONY: build push buildx-push compose-build compose-up compose-down

IMAGE_PREFIX ?= local
IMAGE_NAME ?= prevent-monolith
IMAGE_TAG ?= dev
MODULE ?= prevent-monolith
PLATFORMS ?= linux/amd64,linux/arm64

DOCKERFILE := Dockerfile
CONTEXT := ../../apps/server
IMAGE := $(IMAGE_PREFIX)/$(IMAGE_NAME):$(IMAGE_TAG)

build:
	docker build --build-arg MODULE=$(MODULE) -f $(DOCKERFILE) -t $(IMAGE) $(CONTEXT)

push: build
	docker push $(IMAGE)

buildx-push:
	docker buildx build --build-arg MODULE=$(MODULE) -f $(DOCKERFILE) --platform $(PLATFORMS) -t $(IMAGE) --push $(CONTEXT)

compose-build:
	docker compose --env-file .env build prevent-monolith

compose-up:
	docker compose --env-file .env up -d prevent-monolith

compose-down:
	docker compose --env-file .env down

