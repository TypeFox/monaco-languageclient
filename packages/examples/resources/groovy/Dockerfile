FROM gradle:7-jdk17-focal

RUN apt update \
    && apt upgrade -y \
    && apt install -y ca-certificates curl gnupg unzip

RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt update \
    && apt install -y nodejs

RUN git clone https://github.com/GroovyLanguageServer/groovy-language-server \
    && cd groovy-language-server \
    && ./gradlew build \
    && cd ..

RUN mkdir -p /home/gradle/mlc

COPY ./ /home/gradle/mlc/

WORKDIR /home/gradle/mlc
