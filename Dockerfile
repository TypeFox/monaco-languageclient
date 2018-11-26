FROM gitpod/workspace-full:latest

USER gitpod
RUN bash -l -c "source \$HOME/.nvm/nvm.sh && npm install -g npm@5.6.0"

USER root