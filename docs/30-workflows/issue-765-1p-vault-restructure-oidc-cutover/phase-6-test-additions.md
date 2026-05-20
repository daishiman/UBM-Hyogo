# Phase 6: テスト追加・実行

## メタ情報

- phase: 6 / test-additions
- prev: phase-5-implementation
- next: phase-7-coverage

## 目的

Phase 4 計画と Phase 5 実装に基づくテスト追加・実行を完了させ、grep gate / `op run` smoke / inventory schema 検証の 3 系統がローカルで常時 green になることを確認する。

## 実行タスク

1. canonical grep gate script の対象ファイルと deny regex を確定する
2. positive / negative case の期待 exit code を記録する
3. CI または pre-flight で再実行できるコマンドを固定する

## 入力

- Phase 5 で新規追加された `scripts/verify-onepassword-op-uri-canonical.sh`
- Phase 5 で編集された `.env.example` / runbook / skill reference
- Phase 4 で確定した grep regex pattern と除外パス

## 出力

- `outputs/phase-6/grep-gate-script-spec.md`
- `outputs/phase-6/test-results.md`
- `outputs/phase-6/negative-case-record.md`

## 要件

### TC-1: legacy op:// path gate（正例）

```bash
bash scripts/verify-onepassword-op-uri-canonical.sh
echo "exit=$?"
```

期待: stdout に `OK: no legacy Cloudflare deploy-token op:// paths remain in operational surfaces`、exit 0。

### TC-1 負例試験（gate が機能することの確認）

一時 fixture を使って legacy path を 1 行混入させ、gate が fail を返すことを確認する。`.env.example` を直接汚染せず、`git checkout --` による復元も使わない。

```bash
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
printf 'FOO=op://Cloudflare/API Token/credential\n' > "$tmpdir/.env.example"
bash scripts/verify-onepassword-op-uri-canonical.sh --target "$tmpdir/.env.example" \
  && echo "BUG: gate did not catch" \
  || echo "OK: gate caught regression"
```

期待: 2 行目で `::error:: legacy op:// path remains:` が表示され exit 1、最終 echo が `OK: gate caught regression`。

### TC-2: `op run` smoke（手動・user-gated）

実 1Password authn が必要なため operator のみが実行。本仕様書は手順のみ記載し、実値は記録しない。

```bash
# Phase 11 で実 vault item 整備後に実行
bash scripts/cf.sh whoami
echo "exit=$?"
```

期待: exit 0。`outputs/phase-6/test-results.md` には `✅ whoami succeeded (exit 0)` のみ記録し、account_id / token / URI 値は記録禁止。

### TC-3: inventory 表 schema 検証

```bash
# (i) canonical 2 path が存在
grep -cE 'op://UBM-Hyogo/Cloudflare/api_token_(staging|production)' \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
# 期待: 2 以上

# (ii) legacy 行に deprecated marker
grep -cE 'deprecated.*(#765|issue-765)' \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
# 期待: 1 以上

# (iii) changelog 行
grep -cE '2026-05-18.*issue-765' \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
# 期待: 1 以上
```

### TC-4: 既存 redaction-check の regression

```bash
bash scripts/__tests__/redaction-check.test.sh
echo "exit=$?"
```

期待: exit 0。新規追加 docs / script に実値が混入していないことを保証。

### grep gate スクリプト仕様（`outputs/phase-6/grep-gate-script-spec.md` 記載項目）

| 項目 | 内容 |
|------|------|
| エントリ | `scripts/verify-onepassword-op-uri-canonical.sh` |
| 終了コード | 0 = OK / 1 = legacy 残存 / 2 = 内部エラー |
| regex（検出） | `op://(Cloudflare/API Token/credential\|Vault/Cloudflare/api_token\|UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN\|Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN)` |
| regex（許容） | operational surface では上記 denylist 0 件。canonical 2 path は別 grep で存在確認 |
| 対象パス | `.env.example` / WAF runbook / deployment secrets spec / `scripts/cf.sh` / `apps/web/.dev.vars.example` |
| 依存コマンド | `git`（`git grep` / `git rev-parse`）、`bash` 5+ |
| self-test | 負例試験を README に記載（任意で `__tests__/verify-onepassword-op-uri-canonical.test.sh` を追加可） |

### 既存 redaction-check との統合確認

- `scripts/redaction-check.sh` の pattern に op:// path 識別子は通常 hit しない（識別子は実値ではない）
- 本 Phase 追加の docs / script を `redaction-check.sh` に通して fail しないことを確認（TC-4）

## ローカル実行・検証コマンド

```bash
bash scripts/verify-onepassword-op-uri-canonical.sh
bash scripts/__tests__/redaction-check.test.sh

grep -nE 'op://' .env.example docs/runbooks/cloudflare-waf-operations.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

## 受入基準

- [ ] TC-1 正例が exit 0
- [ ] TC-1 負例で gate が exit 1 を返し regression を捕捉
- [ ] TC-2 `whoami` は Phase 11 完了後に exit 0（本 Phase ではコマンド整備のみ）
- [ ] TC-3 inventory schema 3 条件すべて hit
- [ ] TC-4 redaction-check exit 0

## 依存タスク

- Phase 5 実装完了

## 参照資料

- `phase-4-test-plan.md`
- `phase-5-implementation.md`
- `scripts/verify-onepassword-op-uri-canonical.sh`

## 統合テスト連携

- shell grep gate を integration substitute とし、legacy path の再混入を fail-fast で検知する
- runtime smoke は Phase 11 の user-gated evidence に分離する

## 成果物

- `outputs/phase-6/grep-gate-script-spec.md`
- `outputs/phase-6/test-results.md`（各 TC の exit code とサマリ・実値 0）
- `outputs/phase-6/negative-case-record.md`（負例試験の記録）

## 完了条件

- [ ] TC-1 / TC-3 / TC-4 がローカルで pass
- [ ] 負例試験で gate が fail を返したことを記録
- [ ] TC-2 は Phase 11 着手時に再実行する旨を test-results.md に明記

## タスク100%実行確認【必須】

- [ ] 成果物 3 ファイル作成
- [ ] 全 TC の exit code が記録済み
- [ ] 実値・token 値・vault URI 値が一切記載されていない

## 次Phase

phase-7-coverage.md
