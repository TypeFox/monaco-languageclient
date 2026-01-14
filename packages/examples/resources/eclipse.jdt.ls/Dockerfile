FROM eclipse-temurin:21-jdk

RUN apt update \
    && apt upgrade -y \
    && apt install -y wget curl

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

ARG PATH_MLC=/home/mlc
ARG PATH_ECLIPSE_JDT=${PATH_MLC}/packages/examples/resources/eclipse.jdt.ls/ls
ARG JDT_TAR_URL=https://download.eclipse.org/jdtls/milestones/1.55.0/jdt-language-server-1.55.0-202601131729.tar.gz
ARG JDT_TAR_LOCAL=eclipse.jdt.ls.tar.gz

# prepare
RUN mkdir -p ${PATH_MLC} \
    && mise trust ${PATH_MLC}

# copy repo content
COPY ./ ${PATH_MLC}

RUN cd ${PATH_MLC} \
    && npm i \
    && npm run build

# download and extract Eclipse JDT LS in target folder
RUN mkdir -p ${PATH_ECLIPSE_JDT} \
    && cd ${PATH_ECLIPSE_JDT} \
    && wget -O ${JDT_TAR_LOCAL} ${JDT_TAR_URL} \
    && tar -xzf ${JDT_TAR_LOCAL}

WORKDIR ${PATH_MLC}

CMD ["/bin/bash", "npm run start:example:server:jdtls"]
