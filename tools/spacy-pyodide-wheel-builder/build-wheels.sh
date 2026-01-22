# See https://pyodide.org/en/stable/development/building-packages.html

cd /tmp
apt-get update && apt-get install -y git

uv run --locked --project /workspace -- pyodide xbuildenv install 0.29.3

git clone --depth 1 --branch 5.0.2 https://github.com/emscripten-core/emsdk
cd emsdk
PYODIDE_EMSCRIPTEN_VERSION=$(uv run --locked --project /workspace -- pyodide config get emscripten_version)
./emsdk install ${PYODIDE_EMSCRIPTEN_VERSION}
./emsdk activate ${PYODIDE_EMSCRIPTEN_VERSION}
source emsdk_env.sh

cd /tmp
git clone --depth 1 --branch release-v3.8.11 https://github.com/explosion/spaCy.git
cd spaCy
uv run --locked --project /workspace -- pyodide build -o /workspace/wheels

cd /tmp
git clone --depth 1 --branch release-v1.0.15 https://github.com/explosion/murmurhash.git
cd murmurhash
uv run --locked --project /workspace -- pyodide build -o /workspace/wheels

cd /tmp
git clone --depth 1 --branch release-v2.0.13 https://github.com/explosion/cymem.git
cd cymem
uv run --locked --project /workspace -- pyodide build -o /workspace/wheels

cd /tmp
git clone --depth 1 --branch release-v3.0.12 https://github.com/explosion/preshed.git
cd preshed
uv run --locked --project /workspace -- pyodide build -o /workspace/wheels

cd /tmp
git clone --depth 1 --branch release-v8.3.10 https://github.com/explosion/thinc.git
cd thinc
uv run --locked --project /workspace -- pyodide build -o /workspace/wheels

cd /tmp
git clone --depth 1 --branch release-v1.3.3 https://github.com/explosion/cython-blis.git
cd cython-blis
export BLIS_ARCH=generic
uv run --locked --project /workspace -- pyodide build -o /workspace/wheels

cd /tmp
git clone --depth 1 --branch release-v2.5.2 https://github.com/explosion/srsly.git
cd srsly
uv run --locked --project /workspace -- pyodide build -o /workspace/wheels

cd /workspace/wheels
curl -L -O https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
