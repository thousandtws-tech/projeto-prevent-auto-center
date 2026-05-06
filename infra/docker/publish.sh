#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

IMAGE_PREFIX="${IMAGE_PREFIX:-local}"
IMAGE_NAME="${IMAGE_NAME:-prevent-monolith}"
MODULE="${MODULE:-prevent-monolith}"

if [[ -z "${IMAGE_TAG:-}" ]]; then
  IMAGE_TAG="$(git -C ../.. describe --tags --always --dirty 2>/dev/null || date +%Y%m%d-%H%M%S)"
fi

IMAGE="${IMAGE_PREFIX}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "Building and pushing: ${IMAGE}"
docker buildx build \
  --build-arg "MODULE=${MODULE}" \
  -f Dockerfile \
  --platform "${PLATFORMS:-linux/amd64,linux/arm64}" \
  -t "${IMAGE}" \
  --push \
  ../../apps/server

