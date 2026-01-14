FROM ghcr.io/graalvm/graalpy-community:25

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"

# install mise
RUN curl https://mise.run | sh

# configure mise
RUN mise use --global node@24

RUN mkdir -p /home/mlc/workspace && mkdir -p /home/mlc/server/src

COPY ./packages/examples/resources/debugger/package.json /home/mlc/server
COPY ./packages/examples/src/debugger/server/debugServer.ts /home/mlc/server/src
COPY ./packages/examples/src/debugger/server/DAPSocket.ts /home/mlc/server/src

WORKDIR /home/mlc/server
