#!/bin/bash

DIR_ME=$(realpath $(dirname $0))
DIR_BASE=$(realpath ${DIR_ME}/../../../..)

${DIR_BASE}/scripts/buildImage.sh eclipse.jdt.ls eclipse.jdt.ls $1
