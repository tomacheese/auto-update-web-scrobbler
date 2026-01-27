# CLAUDE.md

## 目的
このファイルは、Claude Code の作業方針とプロジェクト固有ルールを示します。

## 判断記録のルール
1. 判断内容の要約を記載する
2. 検討した代替案を列挙する
3. 採用しなかった案とその理由を明記する
4. 前提条件・仮定・不確実性を明示する
5. 他エージェントによるレビュー可否を示す

## プロジェクト概要
- 目的: Web Scrobbler の LevelDB ファイルと fetch-youtube-bgm サーバのトラック情報を同期する
- 主な機能:
  - ローカルの Web Scrobbler LevelDB からのトラック情報取得
  - fetch-youtube-bgm API からのトラック情報取得
  - トラック情報のマージと同期（サーバ・ローカル双方への反映）

## 重要ルール
- 会話言語: 日本語
- コミットメッセージ: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従う（`<description>` は日本語）
- コード内コメント: 日本語で記載
- エラーメッセージ: 英語で記載
- 日本語と英数字の間には半角スペースを挿入する

## 環境のルール
- ブランチ命名: [Conventional Branch](https://conventional-branch.github.io) に従う（`<type>` は短縮形 `feat`, `fix` を使用）
- GitHub リポジトリ調査方法: 必要に応じてテンポラリディレクトリに clone して検索する
- Renovate PR の扱い: Renovate が作成した既存の PR に対して追加コミットや更新を行わない

## コード改修時のルール
- エラーメッセージの絵文字統一: 既存のエラーメッセージに絵文字が含まれる場合、同様のスタイルで絵文字を含める
- TypeScript の `skipLibCheck` 禁止
- docstring 記載: 関数やインターフェースには日本語で docstring を記載する

## 相談ルール
- Codex CLI: 実装レビュー、局所設計、整合性確認
- Gemini CLI: 外部仕様、最新情報確認
- 指摘への対応ルール: 信頼度スコア 50 以上の指摘には必ず対応する（黙殺禁止）

## 開発コマンド
```bash
# 依存関係のインストール
pnpm install

# 開発実行 (watch モード)
pnpm dev

# 通常実行
pnpm start

# ビルド
pnpm package

# TypeScript コンパイル
pnpm compile

# Lint 実行
pnpm lint

# 自動修正実行
pnpm fix

# テスト実行
pnpm test
```

## アーキテクチャと主要ファイル
- `src/main.ts`: メインエントリーポイント。同期ロジックの核となる部分。
- `src/config.ts`: 設定管理クラス。`data/config.json` を読み込む。
- `src/fyb.ts`: fetch-youtube-bgm API クライアント。
- `src/web-scrobber.ts`: Web Scrobbler の LevelDB 操作クラス。

## 実装パターン
- 設定管理: `@book000/node-utils` の `ConfigFramework` を継承して実装する。
- ロギング: `@book000/node-utils` の `Logger` を使用する。

## テスト
- テスト方針: Jest を使用し、`**/*.test.ts` にテストを記述する。
- 追加テスト条件: 破壊的な変更や新機能追加時にはテストを追加する。

## ドキュメント更新ルール
- `README.md`: 使用方法や設定項目が変更された場合に更新する。
- `src/config.ts`: 設定項目が追加・変更された場合にインターフェースを更新する。

## 作業チェックリスト

### 新規改修時
1. プロジェクトを理解する
2. 作業ブランチが適切であることを確認する
3. 最新のリモートブランチに基づいた新規ブランチであることを確認する
4. PR がクローズされた不要ブランチが削除済みであることを確認する
5. pnpm で依存関係をインストールする

### コミット・プッシュ前
1. Conventional Commits に従っていることを確認する
2. センシティブな情報が含まれていないことを確認する
3. Lint / Format エラーがないことを確認する
4. `pnpm start` または `pnpm dev` で動作確認を行う

### PR 作成前
1. PR 作成の依頼があることを確認する
2. センシティブな情報が含まれていないことを確認する
3. コンフリクトの恐れがないことを確認する

### PR 作成後
1. コンフリクトがないことを確認する
2. PR 本文が最新状態のみを網羅していることを確認する
3. `gh pr checks <PR ID> --watch` で CI を確認する
4. Copilot レビューに対応し、コメントに返信する
5. Codex のコードレビューを実施し、指摘対応を行う

## リポジトリ固有
- LevelDB のロック競合を避けるため、ブラウザが起動中の場合は書き込みがスキップされる仕組みになっている。
- API クライアントは `axios` を使用している。
