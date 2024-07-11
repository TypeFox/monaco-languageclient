FROM eclipse-temurin:17-jdk

ARG MLC_PATH=/home/mlc
ARG ECLIPSE_JDT_PATH=${MLC_PATH}/packages/examples/resources/eclipse.jdt.ls/ls
ARG JDT_TAR_URL=https://download.eclipse.org/jdtls/milestones/1.37.0/jdt-language-server-1.37.0-202406271335.tar.gz
ARG JDT_TAR_LOCAL=eclipse.jdt.ls.tar.gz

RUN apt update \
    && apt upgrade -y
RUN apt install -y wget

RUN curl https://get.volta.sh | bash
ENV VOLTA_FEATURE_PNPM=1
ENV VOLTA_HOME "/root/.volta"
ENV PATH "$VOLTA_HOME/bin:$PATH"
RUN volta install node@20

RUN mkdir -p ${MLC_PATH}

COPY ./ ${MLC_PATH}

RUN mkdir -p ${ECLIPSE_JDT_PATH} \
    && cd ${ECLIPSE_JDT_PATH} \
    && wget -O ${JDT_TAR_LOCAL} ${JDT_TAR_URL} \
    && tar -xzf ${JDT_TAR_LOCAL}

WORKDIR ${MLC_PATH}

CMD ["/bin/bash", "npm i && npm run start:example:server:jdtls"]
