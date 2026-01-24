# GEMINI.md

## 目的
- Gemini CLI 向けのコンテキストと作業方針を定義する。

## 出力スタイル
- 言語: 日本語
- トーン: 簡潔で事実ベース
- 形式: Markdown

## 共通ルール
- 会話は日本語で行う。
- PR とコミットは Conventional Commits に従う。
- PR タイトルとコミット本文の言語: PR タイトルは Conventional Commits 形式（英語推奨）。PR 本文は日本語。コミットは Conventional Commits 形式（description は日本語）。
- 日本語と英数字の間には半角スペースを入れる。

## プロジェクト概要
- 目的: Synchronize Web Scrobbler LevelDB file with fetch-youtube-bgm
- 主な機能: When playing a YouTube video, the title and artist set in fetch-youtube-bgm will correctly scrobble. / It has a synchronization feature with fetch-youtube-bgm, so changes made in either fetch-youtube-bgm or Web Scrobbler will be correctly merged with the registration information. / ⚠️ Due to LevelDB specifications, data cannot be updated while the browser is running.

## コーディング規約
- フォーマット: 既存設定（ESLint / Prettier / formatter）に従う。
- 命名規則: 既存のコード規約に従う。
- コメント言語: 日本語
- エラーメッセージ: 英語

## 開発コマンド
```bash
# 依存関係のインストール
pnpm install

# 開発
pnpm dev

# テスト
pnpm test

# Lint
pnpm lint
```

## 注意事項
- 認証情報やトークンはコミットしない。
- ログに機密情報を出力しない。
- 既存のプロジェクトルールがある場合はそれを優先する。

## リポジトリ固有