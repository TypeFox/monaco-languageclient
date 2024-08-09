FROM gradle:7-jdk17-focal

ARG HOME_DIR=/home/gradle
ARG PATH_MLC=${HOME_DIR}/mlc
ARG PATH_GLS=${HOME_DIR}/groovy-language-server
ARG PATH_GROOVY_JAR=${PATH_MLC}/packages/examples/resources/groovy/lib

RUN apt update \
    && apt upgrade -y
RUN apt install -y curl

RUN curl https://get.volta.sh | bash
ENV VOLTA_FEATURE_PNPM=1
ENV VOLTA_HOME="/root/.volta"
ENV PATH="$VOLTA_HOME/bin:$PATH"
RUN volta install node@20

# prepare
RUN cd ${HOME_DIR} \
    && mkdir -p ${PATH_MLC}

# build groovy language server
RUN cd ${HOME_DIR} \
    && git clone https://github.com/GroovyLanguageServer/groovy-language-server \
    && cd ${PATH_GLS} \
    && ./gradlew build \
    && cd ${HOME_DIR}

# copy repo content
COPY ./ ${PATH_MLC}

# copy language server to target
RUN mkdir -p ${PATH_GROOVY_JAR} \
    && cp ${PATH_GLS}/build/libs/groovy-language-server-all.jar ${PATH_GROOVY_JAR}

WORKDIR ${PATH_MLC}

CMD ["/bin/bash", "npm i && npm run start:example:server:groovy"]
