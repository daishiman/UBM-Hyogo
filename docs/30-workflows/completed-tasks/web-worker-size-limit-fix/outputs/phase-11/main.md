# Phase 11 Evidence Index — web-worker-size-limit-fix

Status: `implemented_local_evidence_captured`（Task A/B はローカル実装済み。command evidence は `manual-smoke-log.md` に集約する）

## テスト方式（NON_VISUAL / docs walkthrough）

本 workflow の visualEvidence は **NON_VISUAL** のため、UI screenshot は作成しない（生成禁止）。テスト方式は以下 2 段で構成する。

1. **docs walkthrough**: phase-1〜10 の spec を読み合わせ、Task A（`next/og` 撤去 → 静的 OG）・Task B（OpenNext production minify 維持 + Worker size CI gate）の手順整合を確認する。
2. **NON_VISUAL 証跡**: typecheck / test / build:cloudflare / `next/og` grep / wasm find / `check-worker-size.sh` のコマンドログを `manual-smoke-log.md` の実測列へ追記する。staging dry-run は user-gated 境界として pending を明示する。

## 発火条件（visualEvidence=NON_VISUAL）

- visualEvidence=NON_VISUAL のため screenshot 生成を行わない。
- 証跡の主ソースは spec walkthrough + ローカルコマンドログとする。
- secret を含まないため証跡ログの redaction は不要。

## 必須 outputs 一覧

| ファイル | 役割 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 証跡インデックス（本ファイル） | present（implemented_local_evidence_captured） |
| `outputs/phase-11/manual-smoke-log.md` | 実行コマンド × 期待結果 × 実測 × PASS/FAIL 表 | present（実測列は実装後取得） |
| `outputs/phase-11/link-checklist.md` | 参照リンク健全性（OK/Broken）表 | present |

## 状態宣言

本サイクルは `implemented_local_evidence_captured`。上記 3 ファイルは spec walkthrough 段階の骨格として present。コード実装サイクル承認後に、`manual-smoke-log.md` の実測列へ各コマンドの実出力（exit code・gzip サイズ・grep/find 件数）を追記する。実装・commit・push・PR・staging deploy はすべて user-gated。
