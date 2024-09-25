#!/usr/bin/env bash

# 3b. Build LLVM

WORKSPACE_DIR=$PWD
# otherwise emcmake is not found
source $WORKSPACE_DIR/emsdk/emsdk_env.sh

cd llvm-project

## Build native tools first
cmake -G Ninja -S llvm -B build-native \
    -DCMAKE_BUILD_TYPE=Release \
    -DLLVM_ENABLE_PROJECTS=clang
cmake --build build-native --target llvm-tblgen clang-tblgen

## Apply a patch for blocking stdin read
git apply $WORKSPACE_DIR/wait_stdin.patch

## Build clangd (1st time, just for compiler headers)
emcmake cmake -G Ninja -S llvm -B build \
    -DCMAKE_CXX_FLAGS="-pthread -Dwait4=__syscall_wait4" \
    -DCMAKE_EXE_LINKER_FLAGS="-pthread -s ENVIRONMENT=worker -s NO_INVOKE_RUN" \
    -DCMAKE_BUILD_TYPE=MinSizeRel \
    -DLLVM_TARGET_ARCH=wasm32-emscripten \
    -DLLVM_DEFAULT_TARGET_TRIPLE=wasm32-wasi \
    -DLLVM_TARGETS_TO_BUILD=WebAssembly \
    -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra" \
    -DLLVM_TABLEGEN=$PWD/build-native/bin/llvm-tblgen \
    -DCLANG_TABLEGEN=$PWD/build-native/bin/clang-tblgen \
    -DLLVM_BUILD_STATIC=ON \
    -DLLVM_INCLUDE_EXAMPLES=OFF \
    -DLLVM_INCLUDE_TESTS=OFF \
    -DLLVM_ENABLE_BACKTRACES=OFF \
    -DLLVM_ENABLE_UNWIND_TABLES=OFF \
    -DLLVM_ENABLE_CRASH_OVERRIDES=OFF \
    -DCLANG_ENABLE_STATIC_ANALYZER=OFF \
    -DLLVM_ENABLE_TERMINFO=OFF \
    -DLLVM_ENABLE_PIC=OFF \
    -DLLVM_ENABLE_ZLIB=OFF \
    -DCLANG_ENABLE_ARCMT=OFF
cmake --build build --target clangd

## Copy installed headers to WASI sysroot
cp -r build/lib/clang/$LLVM_VER_MAJOR/include/* $WORKSPACE_DIR/wasi-sysroot/include/

## Build clangd (2nd time, for the real thing)
emcmake cmake -G Ninja -S llvm -B build \
    -DCMAKE_CXX_FLAGS="-pthread -Dwait4=__syscall_wait4" \
    -DCMAKE_EXE_LINKER_FLAGS="-pthread -s ENVIRONMENT=worker -s NO_INVOKE_RUN -s EXIT_RUNTIME -s INITIAL_MEMORY=2GB -s ALLOW_MEMORY_GROWTH -s MAXIMUM_MEMORY=4GB -s STACK_SIZE=256kB -s EXPORTED_RUNTIME_METHODS=FS,callMain -s MODULARIZE -s EXPORT_ES6 -s WASM_BIGINT -s ASSERTIONS -s ASYNCIFY -s PTHREAD_POOL_SIZE='Math.max(navigator.hardwareConcurrency, 8)' --embed-file=$WORKSPACE_DIR/wasi-sysroot/include@/usr/include" \
    -DCMAKE_BUILD_TYPE=MinSizeRel \
    -DLLVM_TARGET_ARCH=wasm32-emscripten \
    -DLLVM_DEFAULT_TARGET_TRIPLE=wasm32-wasi \
    -DLLVM_TARGETS_TO_BUILD=WebAssembly \
    -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra" \
    -DLLVM_TABLEGEN=$PWD/build-native/bin/llvm-tblgen \
    -DCLANG_TABLEGEN=$PWD/build-native/bin/clang-tblgen \
    -DLLVM_BUILD_STATIC=ON \
    -DLLVM_INCLUDE_EXAMPLES=OFF \
    -DLLVM_INCLUDE_TESTS=OFF \
    -DLLVM_ENABLE_BACKTRACES=OFF \
    -DLLVM_ENABLE_UNWIND_TABLES=OFF \
    -DLLVM_ENABLE_CRASH_OVERRIDES=OFF \
    -DCLANG_ENABLE_STATIC_ANALYZER=OFF \
    -DLLVM_ENABLE_TERMINFO=OFF \
    -DLLVM_ENABLE_PIC=OFF \
    -DLLVM_ENABLE_ZLIB=OFF \
    -DCLANG_ENABLE_ARCMT=OFF
cmake --build build --target clangd
