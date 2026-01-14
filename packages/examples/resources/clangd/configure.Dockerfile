FROM ubuntu

RUN apt update \
    && apt upgrade -y \
    && apt install -y curl git wget build-essential cmake ninja-build python3

RUN mkdir /builder

COPY configure-docker.sh /builder/configure-docker.sh
RUN (cd /builder; bash ./configure-docker.sh)
