#!/bin/bash

echo -e "\nReporting env variable values:"

npmDryRun=${NPM_DRY_RUN:-true}
npmTag=${NPM_TAG:-''}

echo "NPM_DRY_RUN: ${npmDryRun}"
echo "NPM_TAG: ${npmTag}"

echo "NPM_DRY_RUN=${npmDryRun}" >> $GITHUB_ENV
echo "NPM_TAG=${npmTag}" >> $GITHUB_ENV
