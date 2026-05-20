# Phase 4: テスト計画

## メタ情報

- phase: 4 / test-plan
- prev: phase-3-design-review
- next: phase-5-implementation

## 目的

1Password vault `CLOUDFLARE_API_TOKEN` item 整理 + `.env.example` の `op://` 参照 path canonical 統一 + `deployment-secrets-management.md` inventory 更新の差分が、grep gate と `op run` smoke と inventory schema 検証で恒久的に守られるためのテスト追加計画を確定する。`apps/web/.dev.vars.example` は Cloudflare deploy token 参照が無いことを baseline 確認する。

実 1Password mutation・GitHub Secrets 変更・commit は本 Phase では行わず、ローカル検証のみを対象とする。

## 実行タスク

1. legacy deploy-token `op://` path の deny list と対象ファイルを定義する
2. redaction check と manual smoke の実行順序を固定する
3. runtime/user-gated evidence の成功・未実行状態を分離する

## 入力

- Phase 2 設計（変更対象ファイル一覧・canonical op:// path）
- Phase 3 設計レビュー結果（user-gated mutation 範囲）
- 既存 `scripts/redaction-check.sh` の挙動
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の現行 inventory 表

## 出力

- `outputs/phase-4/test-cases.md`
- `outputs/phase-4/test-execution-plan.md`
- `outputs/phase-4/grep-gate-patterns.md`

## 要件

### 検証戦略（3 系統）

| 系統 | 目的 | 主検証手段 |
|------|------|-----------|
| (a) legacy deploy-token op:// path 残存 0 件 gate | operational surface で canonical 以外の Cloudflare deploy token 参照を排除 | denylist grep + 対象パス固定 |
| (b) `op run` smoke | canonical path 経由で `cf.sh whoami` が成功する | `bash scripts/cf.sh whoami` の exit 0 |
| (c) inventory schema 検証 | `deployment-secrets-management.md` の inventory 表が canonical / deprecated 双方を網羅 | bash grep + 表 column 数チェック |

### canonical op:// path（正本候補・ut-27 整合）

| 環境 | canonical path |
|------|----------------|
| staging | `op://UBM-Hyogo/Cloudflare/api_token_staging` |
| production | `op://UBM-Hyogo/Cloudflare/api_token_production` |

> 上記 path 識別子のみを仕様書・テストに記述する。実 token 値・vault URI 値・hash は一切残さない。

## 追加するテスト

### TC-1: legacy op:// path 残存 0 件 regression gate

| 項目 | 内容 |
|------|------|
| ファイル | `scripts/verify-onepassword-op-uri-canonical.sh`（Phase 5 で新規作成） |
| 検証対象 | operational surface only（workflow docs は inventory として legacy 文字列を保持できるため対象外） |
| grep regex | `op://(Cloudflare/API Token/credential|Vault/Cloudflare/api_token|UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN|Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN)` |
| 許容 hit | operational surface では 0 件。canonical 2 path は別 grep で存在確認 |
| 不許可 hit 例 | `op://Cloudflare/API Token/credential` / `op://Cloudflare/CLOUDFLARE_API_TOKEN/credential` / vault 名 `Cloudflare`（top-level）への参照 |
| 期待 | 不許可 hit が 0 件であれば exit 0、1 件以上で exit 1 |
| 対象パス | `.env.example` / `docs/runbooks/cloudflare-waf-operations.md` / `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` / `scripts/cf.sh` / `apps/web/.dev.vars.example` |

### TC-2: `op run` smoke（canonical path 経由）

| 項目 | 内容 |
|------|------|
| ファイル | （手動実行・成果物は phase-6 で記録） |
| 検証内容 | `.env` を canonical へ更新後、`bash scripts/cf.sh whoami` が account_id を返す |
| 期待 | exit 0、stdout に account_id（実値は redaction 済み markdown で記録） |
| 注意 | 実 token 値・account_id 値は記録に残さない。`✅ whoami succeeded` のみ記録 |

### TC-3: inventory 表 schema 検証

| 項目 | 内容 |
|------|------|
| 対象 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| 検証内容 | inventory 表に (i) canonical 2 path が新規行として存在、(ii) legacy path 行に `deprecated` marker が付与、(iii) changelog 行に 2026-05-18 / issue-765 が記載 |
| 期待 | 3 条件すべて grep で hit |

### TC-4: redaction-check 既存 test の regression

| 項目 | 内容 |
|------|------|
| ファイル | `scripts/__tests__/redaction-check.test.sh`（既存） |
| 検証内容 | path 識別子のみで実値が混入していない |
| 期待 | exit 0 |

## 実行コマンド

```bash
# (a) legacy op:// path gate（Phase 5 で実装後）
bash scripts/verify-onepassword-op-uri-canonical.sh

# (b) op run smoke（手動・user-gated；実値は記録禁止）
bash scripts/cf.sh whoami

# (c) inventory 表 schema 検証
grep -nE 'op://UBM-Hyogo/Cloudflare/api_token_(staging|production)' \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
! grep -nE 'op://(Cloudflare/API Token/credential|Vault/Cloudflare/api_token|UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN|Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN)' \
  .env.example docs/runbooks/cloudflare-waf-operations.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
  scripts/cf.sh apps/web/.dev.vars.example
grep -nE 'deprecated.*op://Cloudflare/' \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
grep -nE '2026-05-18.*issue-765' \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md

# 既存 regression
bash scripts/__tests__/redaction-check.test.sh

# 静的検査
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 受入基準

- [ ] TC-1 grep gate が legacy op:// path に対し 0 件 hit を返す
- [ ] TC-2 `whoami` が exit 0 を返し account_id 取得成功（値は記録しない）
- [ ] TC-3 canonical path inventory が 2 行追加され、legacy 行に deprecated marker 付与済
- [ ] TC-4 redaction-check が exit 0
- [ ] `pnpm typecheck` / `pnpm lint` green

## 依存タスク

- issue-762（OIDC migration 前半・closed 前提）
- issue-763（OIDC migration 後半・closed 前提）
- issue-718（legacy CF token revocation・closed 前提）

## カバレッジ AC

本タスクは docs + 新規 bash script の小規模変更につき **coverage AC 適用外**（Phase 7 で根拠を記録）。

## 参照資料

- `phase-2-design.md`
- `scripts/cf.sh`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`

## 統合テスト連携

- `bash scripts/verify-onepassword-op-uri-canonical.sh` を integration substitute とする
- `bash scripts/cf.sh whoami` は user approval 後の NON_VISUAL smoke evidence とする

## 成果物

- `outputs/phase-4/test-cases.md`
- `outputs/phase-4/test-execution-plan.md`
- `outputs/phase-4/grep-gate-patterns.md`

## 完了条件

- [ ] TC-1〜TC-4 が `outputs/phase-4/test-cases.md` に明文化
- [ ] 実行コマンドが Phase 6 で再現可能
- [ ] grep regex pattern と除外パスが `outputs/phase-4/grep-gate-patterns.md` に確定

## タスク100%実行確認【必須】

- [ ] 成果物 3 ファイル作成
- [ ] 実値・token 値・vault URI 値が一切記載されていない（path 識別子のみ）

## 次Phase

phase-5-implementation.md
