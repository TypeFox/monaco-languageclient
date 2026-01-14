FROM gradle:9-jdk21

RUN apt update \
    && apt upgrade -y \
    && apt install -y curl

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

ARG HOME_DIR=/home/gradle
ARG PATH_MLC=${HOME_DIR}/mlc
ARG PATH_GLS=${HOME_DIR}/groovy-language-server
ARG PATH_GROOVY_JAR=${PATH_MLC}/packages/examples/resources/groovy/lib

# prepare
RUN cd ${HOME_DIR} \
    && mkdir -p ${PATH_MLC} \
    && mise trust ${PATH_MLC}

# build groovy language server
RUN cd ${HOME_DIR} \
    && git clone https://github.com/GroovyLanguageServer/groovy-language-server \
    && cd ${PATH_GLS} \
    && ./gradlew build \
    && cd ${HOME_DIR}

# copy repo content
COPY ./ ${PATH_MLC}

RUN cd ${PATH_MLC} \
    && npm i \
    && npm run build

# copy language server to target
RUN mkdir -p ${PATH_GROOVY_JAR} \
    && cp ${PATH_GLS}/build/libs/groovy-language-server-all.jar ${PATH_GROOVY_JAR}

WORKDIR ${PATH_MLC}

CMD ["/bin/bash", "npm run start:example:server:groovy"]
