# SV-Marker

<!-- [![Release version badge](https://img.shields.io/github/v/release/utlis/sv-marker.svg?logo=github)](https://github.com/utlis/sv-marker/releases) -->
<!-- ![license: MIT](https://img.shields.io/badge/license-MIT-informational.svg) -->

[![CI](https://github.com/utlis/sv-marker/actions/workflows/ci.yml/badge.svg)](https://github.com/utlis/sv-marker/actions/workflows/ci.yml)
[![Deploy](https://github.com/utlis/sv-marker/actions/workflows/deploy.yml/badge.svg)](https://github.com/utlis/sv-marker/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-555.svg?logo=react)](https://github.com/facebook/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC.svg?logo=typescript&logoColor=white)](https://github.com/microsoft/TypeScript)
[![code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## 目次

- [SV-Marker](#SV-Marker)
  - [目次](#目次)
  - [概要](#概要)
  - [主な機能](#主な機能)
    - [英文構造を入力](#英文構造を入力)
    - [英文構造を自動生成](#英文構造を自動生成)
    - [構造図の表記スタイルを切り替え](#構造図の表記スタイルを切り替え)
    - [SVGファイルに書き出して再編集](#SVGファイルに書き出して再編集)

## 概要

SV-Markerは、日本の英語教育で使われる英文の構造図を作成するためのWebアプリケーションです。
文の要素（SVOCM）や、修飾関係、並列関係などの情報を入力すると、その情報から構造図が自動的に作成されます。
図を手で描くのではなく、英文構造そのものを直接入力できるのが特徴です。

- URL：https://utlis.github.io/sv-marker/

https://github.com/user-attachments/assets/74221d6e-f872-4a46-a820-8de77d559695

## 主な機能

### 英文構造を入力

語句をドラッグして選択するだけで、文の要素（SVOCM）や、修飾関係、並列関係などの情報を直感的に入力できます。

https://github.com/user-attachments/assets/47d6cfed-7718-4a08-a638-6bbcd18276cc

### 英文構造を自動生成

自然言語処理ライブラリであるStanzaを用いて、英文構造を高精度で自動生成できます。

https://github.com/user-attachments/assets/d2904d61-8d26-4b60-ac01-5915639e0946

### 構造図の表記スタイルを切り替え

同じ英文構造を異なる表記スタイルで表示できます。構造図の表記スタイルを細かくカスタマイズすることもできます。

https://github.com/user-attachments/assets/367486d7-dd28-4a5b-b2c8-47f780a18bf7

### SVGファイルに書き出して再編集

構造図をSVGファイルとして書き出すことができます。出力したSVGファイルをインポートすることもできるため、あとから編集を再開することができます。

https://github.com/user-attachments/assets/4373029c-edf3-442d-a2eb-baf55df55848
