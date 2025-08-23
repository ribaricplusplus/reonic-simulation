cmake_minimum_required(VERSION 3.31)

project(simulation CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
  node_addon_api
  GIT_REPOSITORY https://github.com/nodejs/node-addon-api.git
  GIT_TAG v8.5.0
)
FetchContent_MakeAvailable(node_addon_api)


execute_process(
  # I'm not sure if this resolves to include path on all OSes and node installations
  COMMAND node -p "require('path').resolve(process.execPath, '..', '..', 'include/node')"
  OUTPUT_VARIABLE NODE_INCLUDE_DIR
  OUTPUT_STRIP_TRAILING_WHITESPACE
)
message(STATUS "Found Node.js include directory: ${NODE_INCLUDE_DIR}")


add_library(addon SHARED
  src/addon.cpp
  src/worker.cpp)

target_include_directories(addon PUBLIC
  "${NODE_INCLUDE_DIR}"
  "${node_addon_api_SOURCE_DIR}" # Include path for node-addon-api
  "include"
)

set_target_properties(addon PROPERTIES
  PREFIX ""             # No 'lib' prefix (e.g., not 'libaddon.so')
  SUFFIX ".node"        # The suffix must be '.node'
)
