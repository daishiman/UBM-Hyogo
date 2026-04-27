# Phase 4 成果物: 事前検証 runbook (precheck-runbook.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 4 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 実行主体 | Phase 5 セットアップ実行担当者（将来の future-file-upload-implementation 担当） |

## 1. 目的

Phase 5 のセットアップを安全に実行できる状態を事前検証し、上流タスク完了確認・wrangler / Token 状態確認・命名衝突確認・ロールバック手順確認を行う。

## 2. 前提

- 01b-parallel-cloudflare-base-bootstrap 完了済（Account ID / 命名トポロジー確定）
- 04-serial-cicd-secrets-and-environment-sync 完了済（Secrets / Variables 経路確立）
- mise / pnpm / wrangler 3.x 以上が利用可能
- Cloudflare アカウントへのログイン権限あり

## 3. 実行手順

### ステップ 1: 上流タスク成果物確認

```bash
# 01b の token-scope-matrix.md と cloudflare-bootstrap-runbook.md を参照
ls docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/

# 04 の index.md を参照
ls docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md
```

期待: 全ファイル存在 / TBD が残っていない

### ステップ 2: Cloudflare アカウント・Token 確認

```bash
# ログイン中アカウントの確認（運用アカウントであること）
wrangler whoami

# 既存 API Token のスコープを Dashboard で確認:
# Cloudflare Dashboard > My Profile > API Tokens
# - 既存 Token: Workers / D1 / KV / Secrets スコープ
# - R2:Edit が含まれていないこと（採用案D で専用 Token 新規作成のため）
```

期待: アカウント表示が `ubm-hyogo` 運用アカウント

### ステップ 3: 既存 wrangler.toml 状態確認

```bash
# apps/api/wrangler.toml に既存 R2 バインディングがないこと
grep -n "r2_buckets" apps/api/wrangler.toml || echo "OK: no existing r2_buckets"

# apps/web/wrangler.toml に R2 設定がないこと（不変条件 5）
grep -n "r2_buckets\|R2_BUCKET" apps/web/wrangler.toml || echo "OK: apps/web has no R2 binding"

# 既存バインディング一覧を記録（参考）
grep -n "binding" apps/api/wrangler.toml
```

期待: 双方とも `OK` が出力される

### ステップ 4: wrangler バージョン・R2 操作確認

```bash
# wrangler 3.x 以上
wrangler --version

# R2 操作権限（list が通れば OK）
wrangler r2 bucket list
```

期待: バージョン 3.x 以上 / list 実行可能（既存バケットが空でも OK）

### ステップ 5: 命名衝突確認

```bash
# 同名バケットが既に存在しないこと
wrangler r2 bucket list | grep -E "ubm-hyogo-r2-(prod|staging)" && echo "FAIL: collision" || echo "OK: no collision"
```

期待: `OK: no collision`

### ステップ 6: ロールバック手順事前確認

precheck-checklist.md の項目 12-15 を参照。`rollback-procedure.md` の各手順が実行可能であることを目視確認のみ行う（実行はしない）。

### ステップ 7: GitHub Secrets 登録経路確認

```bash
# gh CLI で Secrets 一覧確認（値は表示されない）
gh secret list

# CLOUDFLARE_R2_TOKEN の有無を確認（Phase 5 着手前に登録予定）
gh secret list | grep CLOUDFLARE_R2_TOKEN || echo "INFO: not yet registered (Phase 5 で登録)"
```

## 4. 検証ログ記録形式

`precheck-checklist.md` の各項目に対し以下の形式で記録:

```
| # | カテゴリ | チェック項目 | 期待結果 | 状態 (PASS/FAIL) | 記録（実行日時 / 実行者 / 備考） |
```

FAIL 時は `原因 / 対応 / 再検証日時` を備考欄に追記。

## 5. 機密情報の取扱い

- `wrangler whoami` の出力に Account ID が含まれる場合、ログには記録しない（PASS / FAIL のみ）
- 実 Token 値・実本番ドメインは精査ログにも記載しない
- スクリーンショットは取得しない（NON_VISUAL タスク）

## 6. ゲート判定

| 結果 | 判定 | アクション |
| --- | --- | --- |
| 全 15 項目 PASS | GO | Phase 5 へ進む |
| ステップ 1 で上流未完了 | NO-GO | 上流タスク完了待ち |
| ステップ 3 で apps/web 混入発覚 | RETURN | Phase 2 設計差し戻し |
| ステップ 4 で wrangler バージョン不足 | 条件付き GO | wrangler 更新後に再実行 |
| その他 FAIL | RETURN | 該当 Phase に差し戻し |

## 7. 完了条件チェック

- [x] 全 7 ステップの手順が実行可能な粒度で記載
- [x] 機密情報の取扱いが明記
- [x] ゲート判定マトリクスが明確
- [x] precheck-checklist.md と連動
