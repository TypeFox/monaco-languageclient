FROM eclipse-temurin:17-jdk

ARG PATH_MLC=/home/mlc
ARG PATH_ECLIPSE_JDT=${PATH_MLC}/packages/examples/resources/eclipse.jdt.ls/ls
ARG JDT_TAR_URL=https://download.eclipse.org/jdtls/milestones/1.37.0/jdt-language-server-1.37.0-202406271335.tar.gz
ARG JDT_TAR_LOCAL=eclipse.jdt.ls.tar.gz

RUN apt update \
    && apt upgrade -y
RUN apt install -y wget

RUN curl https://get.volta.sh | bash
ENV VOLTA_FEATURE_PNPM=1
ENV VOLTA_HOME="/root/.volta"
ENV PATH="$VOLTA_HOME/bin:$PATH"
RUN volta install node@20

# prepare
RUN mkdir -p ${PATH_MLC}

# copy repo content
COPY ./ ${PATH_MLC}

# download and extract Eclipse JDT LS in target folder
RUN mkdir -p ${PATH_ECLIPSE_JDT} \
    && cd ${PATH_ECLIPSE_JDT} \
    && wget -O ${JDT_TAR_LOCAL} ${JDT_TAR_URL} \
    && tar -xzf ${JDT_TAR_LOCAL}

WORKDIR ${PATH_MLC}

CMD ["/bin/bash", "npm i && npm run start:example:server:jdtls"]
