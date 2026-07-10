# GitHub Copilot コードレビュー指示

このファイルは GitHub Copilot のコードレビュー機能向けの指示です。以下の観点でレビューしてください。

## プロジェクト概要

Web Scrobbler の LevelDB ファイルと fetch-youtube-bgm サーバのトラック情報を双方向に同期する TypeScript 製 CLI ツールです。ローカルの LevelDB 読み書きと API 通信を伴います。

## 技術スタック

- 言語: TypeScript (Node.js / tsx 実行)
- パッケージマネージャー: pnpm
- 主要ライブラリ: `level` (LevelDB 操作)、`axios` (API 通信)、`@book000/node-utils` (設定管理・ロギング)、`jest` + `ts-jest` (テスト)

## 強制されている規約（違反はフラグする）

- Prettier に準拠する。設定は `.prettierrc.yml`（セミコロンなし・シングルクォート・`printWidth: 80`・`trailingComma: es5`・`bracketSameLine: true`）。
- ESLint 設定は `@book000/eslint-config` を継承する（`eslint.config.mjs`）。
- TypeScript の `skipLibCheck` を有効化しない。
- 命名はキャメルケース。
- 関数・インターフェースには JSDoc docstring を日本語で記載する。

## レビュー時に重点確認する点

- エラーハンドリング: LevelDB 操作・ネットワーク通信（axios）で例外が握りつぶされていないか、失敗時のログとスキップ処理が適切か。
- データ破損リスク: LevelDB を直接書き込むため、同期・マージロジックの破壊的操作が既存データを壊さないか。ブラウザ起動中はロック競合で書き込みをスキップする既存挙動を壊していないか。
- 設定バリデーション: `data/config.json` はユーザー環境依存のため、読み込み時の検証が十分か。
- 破壊的変更・新機能追加時にテスト（`**/*.test.ts`）が追加・更新されているか。
- 設定項目の追加・変更時に `src/config.ts` のインターフェースと `README.md` が更新されているか。

## セキュリティ

- API キー・パスワード・トークン等の認証情報がコードにハードコードされていないか。
- ログに個人情報・認証情報が出力されていないか。

## フラグすべきでない既知パターン

- ソースコードのコメント・docstring が日本語であること（本プロジェクトの規約であり英語化は不要）。
- エラーメッセージ等に絵文字が含まれること（既存スタイルに合わせた意図的なもの）。
- セミコロンを付けないコードスタイル（Prettier 設定による）。
