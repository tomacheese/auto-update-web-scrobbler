# GitHub Copilot Instructions

## プロジェクト概要
- 目的: Web Scrobber の LevelDB ファイルと fetch-youtube-bgm サーバのトラック情報を同期する
- 主な機能:
  - ローカルの Web Scrobber LevelDB からのトラック情報取得
  - fetch-youtube-bgm API からのトラック情報取得
  - トラック情報のマージと同期（サーバ・ローカル双方への反映）
- 対象ユーザー: 開発者、音楽管理ユーザー

## 共通ルール
- 会話は日本語で行う。
- PR とコミットは [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従う。
  - `<type>(<scope>): <description>` 形式
  - `<description>` は日本語で記載
- 日本語と英数字の間には半角スペースを入れる。

## 技術スタック
- 言語: TypeScript
- 実行環境: Node.js (tsx)
- パッケージマネージャー: pnpm
- 主要ライブラリ:
  - level (LevelDB 操作)
  - axios (API 通信)
  - @book000/node-utils (ユーティリティ、設定管理)
  - jest (テスト)

## コーディング規約
- TypeScript の `skipLibCheck` は使用しない。
- 関数やインターフェースには docstring (JSDoc) を日本語で記載する。
- 既存の命名規則（キャメルケース）とフォーマット（Prettier）に従う。

## 開発コマンド
```bash
# 依存関係のインストール
pnpm install

# 開発実行 (watch モード)
pnpm dev

# 通常実行
pnpm start

# ビルド (コンパイルとパッケージング)
pnpm package

# TypeScript コンパイル
pnpm compile

# Lint 実行
pnpm lint

# 自動修正実行 (Prettier, ESLint)
pnpm fix

# テスト実行
pnpm test
```

## テスト方針
- テストフレームワーク: Jest (`ts-jest`)
- テストファイルは `**/*.test.ts` 形式で配置する。
- 破壊的な変更を行う場合は必ずテストを追加または更新する。

## セキュリティ / 機密情報
- API キーやパスワードなどの機密情報は直接コードに記述しない。
- 設定は `data/config.json` で管理し、テンプレート（存在する場合）を参考にする。
- ログに個人情報や認証情報を出力しない。

## ドキュメント更新
- `README.md`: プロジェクトの使用方法や設定方法の変更時に更新。
- `src/config.ts`: 設定項目の追加・変更時に IConfiguration インターフェースを更新。

## リポジトリ固有
- LevelDB の操作には `level` ライブラリを使用しており、書き込み時はロックに注意する必要がある。
- 設定ファイルは `data/config.json` に配置されることが期待されている。
