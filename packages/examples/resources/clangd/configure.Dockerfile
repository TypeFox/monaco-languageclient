FROM ubuntu

RUN apt update \
    && apt upgrade -y \
    && apt install -y curl git wget build-essential cmake ninja-build python3

RUN curl https://get.volta.sh | bash
ENV VOLTA_FEATURE_PNPM=1
ENV VOLTA_HOME "/root/.volta"
ENV PATH "$VOLTA_HOME/bin:$PATH"

RUN volta install node \
    && volta install pnpm

RUN mkdir /builder

COPY configure-docker.sh /builder/configure-docker.sh
RUN (cd /builder; ./configure-docker.sh)
