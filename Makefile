format:
	npm run format

format/check:
	npm run format:check

build:
	npm run build

type-check:
	npm run type-check --workspaces

lint:
	npm run lint

clean:
	npm run clean

build/packages:
	npm run build:packages

stanza-server/generate:
	cd apps/stanza-server && uv run python -c "import main; import json; print(json.dumps(main.app.openapi()))" > ../../openapi/stanza-server/openapi.json && npx prettier --write ../../openapi/stanza-server/openapi.json

stanza-server/generate/check:
	make stanza-server/generate && git diff --exit-code -- openapi/stanza-server/openapi.json

backend/generate:
	npm run stanza-server:generate --workspace=backend

backend/dev:
	npm run dev --workspace=backend

backend/build:
	npm run build --workspace=backend

backend/type-check:
	npm run type-check --workspace=backend

backend/clean:
	npm run clean --workspace=backend

frontend/dev:
	npm run dev --workspace=frontend

frontend/build:
	npm run build --workspace=frontend

frontend/type-check:
	npm run type-check --workspace=frontend

frontend/clean:
	npm run clean --workspace=frontend

evals/generate:
	npm run stanza-server:generate --workspace=evals

evals/build:
	npm run build --workspace=evals

evals/type-check:
	npm run type-check --workspace=evals

evals/clean:
	npm run clean --workspace=evals
