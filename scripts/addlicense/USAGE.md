# Use addlicense to check headers in code files

## Prerequisites

- Docker and Docker Compose installed on your system

## Container Image

We build our own image

## Usage with Docker Compose

### Check TypeScript files for license headers

You can either use docker compose directly or invoke a npm script.

```bash
docker compose -f ./scripts/addlicense/docker-compose.yml run --rm addlicense-check
# or
npm run license:check
```

### Add missing license headers

```bash
docker compose -f ./scripts/addlicense/docker-compose.yml run --rm addlicense-add
# or
npm run license:add
```

### Print addlicense help

```bash
docker compose -f ./scripts/addlicense/docker-compose.yml run --rm addlicense-help
# or
npm run license:help
```
