FROM gradle:7-jdk17-focal

ARG MLC_PATH=/home/gradle/mlc

RUN apt update \
    && apt upgrade -y \
    && apt install -y ca-certificates curl gnupg unzip

RUN curl https://get.volta.sh | bash
ENV VOLTA_FEATURE_PNPM=1
ENV VOLTA_HOME "/root/.volta"
ENV PATH "$VOLTA_HOME/bin:$PATH"
RUN volta install node@20

RUN git clone https://github.com/GroovyLanguageServer/groovy-language-server \
    && cd groovy-language-server \
    && ./gradlew build \
    && cd ..

RUN mkdir -p ${MLC_PATH}

COPY ./ ${MLC_PATH}

WORKDIR ${MLC_PATH}
