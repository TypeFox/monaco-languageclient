FROM ghcr.io/graalvm/graalpy-community:24

RUN curl https://get.volta.sh | bash
ENV VOLTA_FEATURE_PNPM=1
ENV VOLTA_HOME="/root/.volta"
ENV PATH="$VOLTA_HOME/bin:$PATH"

RUN volta install node@22

RUN mkdir -p /home/mlc/workspace
RUN mkdir -p /home/mlc/server/src

COPY ./packages/examples/resources/debugger/package.json /home/mlc/server
COPY ./packages/examples/src/debugger/server/debugServer.ts /home/mlc/server/src
COPY ./packages/examples/src/debugger/server/DAPSocket.ts /home/mlc/server/src

WORKDIR /home/mlc/server
