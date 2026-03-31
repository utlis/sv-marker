# AGENTS.md

## 概要

SV-Markerは、日本の英語教育で使われる英文の構造図を作成するためのWebアプリケーションです。英文構造に関する情報と、構造図の表記規約をもとに、構造図を生成します。

## ディレクトリ構造

- `apps/frontend`: 英文構造に関する情報の入力、構造図の表記規約の切り替え、構造図の表示などを扱う
- `apps/backend`: フロントエンドからのAPI呼び出しを受け、Stanzaサーバーにリクエストを送り、その解析結果をもとに英文構造に関する情報を生成する
- `apps/stanza-server`: FastAPIベースのStanzaのサーバー。英文を解析し、dependency parseやconstituency parseの結果などを返す
- `packages/sentence-structure-document`: 英文構造に関する情報の定義、検証、操作、入出力を扱う
- `packages/sentence-structure-diagram-notation`: 構造図の表記規約の定義、検証、表記規約のプリセットの定義、入出力を扱う
- `packages/sentence-structure-diagram`: 英文構造に関する情報と構造図の表記規約から、構造図のデータやSVGを生成する
- `packages/sentence-structure-document-from-stanza`: Stanzaの解析結果を英文構造に関する情報に変換する
- `evals`: 自動生成の評価用コード

## コマンド

Node側はnpm workspacesで管理している。`apps/stanza-server`だけはPythonとなっている。

### 変更内容の確認

```bash
npm run format:check
npm run build
```

特定のworkspaceだけ確認したいときは、`npm run build --workspace=<workspace>`を使う。

### 開発用サーバーの起動

```bash
npm run dev --workspace=apps/frontend
npm run dev --workspace=apps/backend
cd apps/stanza-server && uv run fastapi dev
```

### 型定義の更新

```bash
npm run stanza-server:generate --workspace=apps/backend
```

実行前に`apps/stanza-server`が`http://127.0.0.1:8000`で起動している必要がある。
