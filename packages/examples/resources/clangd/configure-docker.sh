#!/usr/bin/env bash
# It's not recommend for you to run this script directly,
# (because I'm not good at writing this sorry)
# but you can use it as a reference for building.

# 0. Configs

# sudo apt install vim git build-essential cmake ninja-build python3

## Note: Better to make sure WASI SDK version matches the LLVM version
EMSDK_VER=3.1.52
WASI_SDK_VER=22.0
WASI_SDK_VER_MAJOR=22
LLVM_VER=18.1.2
LLVM_VER_MAJOR=18

# 1. Get Emscripten

git clone --branch $EMSDK_VER --depth 1 https://github.com/emscripten-core/emsdk
pushd emsdk
./emsdk install $EMSDK_VER
./emsdk activate $EMSDK_VER
source ./emsdk_env.sh
popd

# 2. Prepare WASI sysroot

wget -O- https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-$WASI_SDK_VER_MAJOR/wasi-sysroot-$WASI_SDK_VER.tar.gz | tar -xz

# 3a. Build LLVM

git clone --branch llvmorg-$LLVM_VER --depth 1 https://github.com/llvm/llvm-project
