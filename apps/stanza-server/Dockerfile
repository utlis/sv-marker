FROM python:3.14
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /uvx /bin/

WORKDIR /app

COPY apps/stanza-server/pyproject.toml apps/stanza-server/uv.lock .
RUN uv sync --frozen

RUN uv run python -c 'import stanza; stanza.Pipeline("en", processors="tokenize,mwt,pos,lemma,depparse,constituency", package="default_accurate")'

COPY apps/stanza-server .

EXPOSE 8000

CMD ["uv", "run", "fastapi", "run", "main.py"]
