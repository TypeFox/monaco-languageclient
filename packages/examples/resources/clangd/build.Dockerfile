FROM ghcr.io/typefox/monaco-languageclient/clangd-wasm-configure:latest

COPY build-docker.sh /builder/build-docker.sh
COPY wait_stdin.patch /builder/wait_stdin.patch

RUN (cd /builder; bash ./build-docker.sh)
