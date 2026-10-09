#!/bin/bash

set -euo pipefail

DIR_ME=$(realpath $(dirname $0))
DIR_BASE=$(realpath ${DIR_ME}/..)
DIR_IMAGES=$(realpath ${DIR_BASE}/packages/examples/resources)

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <subpath> <image_name> [--no-cache]"
    exit 1
fi
SUBPATH="$1"
IMAGE_NAME="$2"
NO_CACHE=""
if [ "$#" -eq 3 ] && [ "$3" == "--no-cache" ]; then
    NO_CACHE="$3"
fi

CONTAINERFILE=${DIR_IMAGES}/${SUBPATH}/Containerfile
IMAGE_TAG="ghcr.io/typefox/monaco-languageclient/${IMAGE_NAME}:${VERSION_CONTAINER_IMAGES}"

echo -e "\nBuilding: ${IMAGE_TAG}\n"

tmpfile=$(mktemp)
podman-remote build ${NO_CACHE} \
    --tag ${IMAGE_TAG} \
    --pull=missing \
    --build-arg VERSION_CONTAINER_IMAGES=${VERSION_CONTAINER_IMAGES} \
    -f ${CONTAINERFILE} \
    ${DIR_BASE}
