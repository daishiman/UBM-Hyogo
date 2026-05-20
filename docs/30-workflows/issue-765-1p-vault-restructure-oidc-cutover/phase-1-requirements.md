# Phase 1: 要件定義

## メタ情報

- task_id: `issue-765-1p-vault-restructure-oidc-cutover`
- phase: 1 / requirements
- prev: なし
- next: phase-2-design

## 目的

OIDC supported deploy path と production cutover evidence が揃った後に 1Password vault 上 Cloudflare API Token 参照 path を canonical 化するため、現状 op:// 参照 inventory・受け入れ基準・deprecation window policy を確定する。#762/#763/#718 の Issue state が closed でも、aiworkflow 正本上の `CLOUDFLARE_API_TOKEN` direct-token contract が維持されている間は Phase 11 mutation を実行しない。

## 実行タスク

1. 現行 `op://` 参照を operational / historical / template / task-spec に分類する
2. OIDC support と current token contract の成立状態を aiworkflow 正本で照合する
3. 受け入れ基準と deprecation window policy を secret 値なしで定義する

## 入力

- Issue #765 本文（DoD: 1Password item 整理 / `.env` 系 op:// path 更新 / inventory 正本更新）
- 前提 Issue #762 / #763 / #718 の Issue state と、aiworkflow 正本上の OIDC support / current token contract
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（op:// 参照 inventory 正本）
- 現状調査で検出された 6 種の op:// path 乖離

## 出力

- `outputs/phase-1/op-uri-inventory-current.md`（6 種乖離の出現箇所・分類）
- `outputs/phase-1/acceptance-criteria.md`（AC-1〜AC-7）
- `outputs/phase-1/deprecation-window-policy.md`（legacy item の archive→delete までの期間定義）

## Step 0: P50 チェック（必須）

```bash
# 現状の op:// 参照を一括確認
rg -n 'op://' .env.example apps/web/.dev.vars.example scripts docs .claude

# 前提 Issue が closed であることを確認
gh issue view 762 --json state -q .state
gh issue view 763 --json state -q .state
gh issue view 718 --json state -q .state

# aiworkflow 正本の current contract を確認
rg -n 'CLOUDFLARE_API_TOKEN.*current|supported OIDC deploy path|Issue #717|Issue #718' \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
  .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
  .claude/skills/aiworkflow-requirements/indexes/resource-map.md
```

期待: 上記 3 Issue が `CLOSED`、op:// 参照は 6 種に分類可能な状態。OIDC supported deploy path が未確認または `web-cd` direct-token contract が current の場合、Phase 11 mutation は `blocked_by_oidc_support` とする。

## 要件

### Functional

- **F-1**: 6 種の op:// path 乖離を出現ファイル・行番号付きで inventory 化する
- **F-2**: 各 op:// path を「canonical 候補 / runbook / historical / template / task-spec」のいずれかに分類する
- **F-3**: canonical 候補 path（`op://UBM-Hyogo/Cloudflare/api_token_staging` / `api_token_production`）を要件として宣言し、Phase 2 で最終確定する
- **F-4**: local-dev 用 read-only scope item を canonical path と分離する設計方針を明文化する
- **F-5**: deprecation window（legacy item を archive で何日保持して delete するか）を policy 化する
- **F-6**: aiworkflow 正本の OIDC support / current token contract を照合し、未成立なら実 mutation を blocked にする

### Non-functional

- **NF-1**: 1Password item の値・URI・token 値・suffix を inventory・AC ファイルに焼き込まない
- **NF-2**: `.env` 実値の読み取り・grep を行わない（op 参照 path のみ操作対象）
- **NF-3**: legacy op:// path の即時削除を禁じ、必ず rollback 可能な deprecation window を確保する

## 受け入れ基準（AC）

- **AC-1**: 6 種の op:// path の出現箇所が `outputs/phase-1/op-uri-inventory-current.md` に列挙されている
- **AC-2**: 各 path に区分（canonical 候補 / runbook / historical / template / task-spec）が付与されている
- **AC-3**: canonical 候補 `op://UBM-Hyogo/Cloudflare/api_token_staging` / `api_token_production` が AC に明示されている
- **AC-4**: local-dev 用 item は別 path として分離する旨が明文化されている
- **AC-5**: deprecation window の日数・運用主体・rollback 手順が `deprecation-window-policy.md` に記載されている
- **AC-6**: 前提 Issue #762 / #763 / #718 がすべて closed であることが evidence として記録されている
- **AC-7**: inventory・AC ファイルに secret 実値・URI・hash が含まれないこと
- **AC-8**: aiworkflow 正本の current token contract 照合結果が evidence として記録され、未成立時は Phase 11 mutation が blocked になること

## 依存タスク

- `issue-717-followup-001`（closed・解消済）
- `issue-717-followup-002`（closed・解消済）
- `issue-640-followup-002` / Issue #718（closed・解消済）

## 不変条件

- 1Password item 値・URI・token 値・suffix を仕様書に焼き込まない
- 1Password vault mutation は user-gated（本 Phase では evidence 化のみで mutation しない）

## 参照資料

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
- `docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md`

## 統合テスト連携

- application integration test は対象外。代替として Phase 6 の grep gate と Phase 11 の redacted text evidence で検証する
- user-gated runtime smoke は `bash scripts/cf.sh whoami` として Phase 11 に分離する

## 成果物

- `outputs/phase-1/op-uri-inventory-current.md`
- `outputs/phase-1/acceptance-criteria.md`
- `outputs/phase-1/deprecation-window-policy.md`

## 完了条件

- [ ] AC-1〜AC-7 が `acceptance-criteria.md` に明文化されている
- [ ] 6 種 op:// path inventory が分類済み
- [ ] deprecation window policy が運用主体・期間付きで文書化されている
- [ ] 前提 Issue closed 状態が evidence 化されている

## タスク100%実行確認【必須】

- [ ] 成果物 3 ファイルが作成されている
- [ ] Phase 2 に進む gate が NO-GO になっていない

## 次Phase

phase-2-design.md
