# Simulation module

## Building

``` bash
cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
cmake --build build
```

## Usage

- Workers run on libuv’s pool (default size 4). To run more in parallel, set `UV_THREADPOOL_SIZE` before starting Node.
