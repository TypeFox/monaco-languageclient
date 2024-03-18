# Groovy Language Server self-built instructions

## Preperation

In another directory run (Requires Gradle 7 and OpenJDK 17)

```shell
git clone https://github.com/GroovyLanguageServer/groovy-language-server
./gradlew build
```

Afterwards copy the jar file from from `groovy-language-server/build/libs/groovy-language-server-all.jar` to `packages/examples/resources/external/groovy`.

From the root of this repository run:

```shell
# start the express server with the language server running as external Java process.
npm run start:example:server:groovy
```
