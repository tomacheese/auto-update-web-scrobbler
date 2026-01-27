# GEMINI.md

## 目的
このファイルは、Gemini CLI 向けのコンテキストと作業方針を定義します。

## 出力スタイル
- 言語: 日本語
- トーン: 専門的かつ簡潔
- 形式: GitHub Flavored Markdown

## 共通ルール
- 会話は日本語で行う
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従い、説明文は日本語とする
- 日本語と英数字の間には半角スペースを挿入する

## プロジェクト概要
- 目的: Web Scrobbler の LevelDB ファイルと fetch-youtube-bgm サーバのトラック情報を同期する
- 主な機能: LevelDB からのデータ読み書き、API 通信、データのマージロジック

## コーディング規約
- フォーマット: Prettier に準拠
- 命名規則: キャメルケース
- コメント言語: 日本語
- エラーメッセージ言語: 英語

## 開発コマンド
```bash
# インストール
pnpm install

# 開発
pnpm dev

# ビルド
pnpm package

# テスト
pnpm test

# Lint/Format
pnpm lint
pnpm fix
```

## 注意事項
- 認証情報（API キー等）をコミットしない
- ログに機密情報を出力しない
- 既存のロジックや規約を優先し、一貫性を保つ
- LevelDB の書き込みロックに注意する

## リポジトリ固有
- `@book000/node-utils` を多用しているため、その仕様を尊重する
- 同期処理は破壊的な操作を含むため、実行前にデータの整合性を確認する
- PR 作成時は upstream に向けて作成し、ブランチ命名規則を遵守する
