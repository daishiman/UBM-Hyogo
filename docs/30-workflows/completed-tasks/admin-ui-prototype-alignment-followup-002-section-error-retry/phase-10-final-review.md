---
phase: 10
title: Local verification commands
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 10: ローカル検証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 10 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

ローカル検証の責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-10-final-review.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. 前提

- Node 24.15.0 / pnpm 10.33.2（`.mise.toml` 固定）
- `mise install` 済み・`mise exec -- pnpm install` 済み

## 2. 検証コマンド一覧

```bash
# 1. 型チェック
mise exec -- pnpm typecheck

# 2. lint
mise exec -- pnpm lint

# 3. unit（既存）
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx

# 4. unit（新規）
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx

# 5. design tokens
mise exec -- pnpm verify:tokens

# 6. gate-metadata
mise exec -- pnpm gate-metadata:validate

# 7. phase12 compliance
mise exec -- pnpm verify:phase12-compliance

# 8. PR pre-flight 一括
bash scripts/verify-pr-ready.sh

# 9. page.tsx "use client" 追加検出（diff base = dev）
git diff dev...HEAD -- 'apps/web/app/(admin)/admin/**/page.tsx' \
  | rg -n '^\+.*"use client"' \
  || echo "OK: no use client added to admin page.tsx"

# 10. 採用 page 集合の確認（11 page 想定）
rg -l 'AdminSectionError(Client)?' 'apps/web/app/(admin)/admin'
```

## 3. evidence 取得（Phase 11 配置用）

```bash
WF=docs/30-workflows/admin-ui-prototype-alignment-followup-002-section-error-retry
mkdir -p "$WF/outputs/phase-11"

# 単体テスト結果保存
mise exec -- pnpm exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx \
  2>&1 | tee "$WF/outputs/phase-11/unit-test-result.md"

# grep 結果保存
{
  echo '## use-client grep (admin page)'
  rg -n '^"use client"' 'apps/web/app/(admin)/admin/' || true
  echo
  echo '## HEX direct write check'
  rg -n '#[0-9a-fA-F]{3,8}' \
    'apps/web/src/features/admin/components/_shared/AdminSectionError.tsx' \
    'apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx' \
    || echo 'OK: no HEX'
} | tee "$WF/outputs/phase-11/grep-use-client-result.md"
```

## 4. 失敗時の自動修復順序（CLAUDE.md PR フロー準拠）

1. `pnpm install --force` で依存整合
2. `pnpm lint --fix` 自動修復
3. `pnpm typecheck` 結果から型注釈追加・unused import 除去
4. 単体 spec fail → Phase 6 §7 切り分け
5. design-tokens fail → HEX を OKLch 経由 class に置き換え
6. gate-metadata fail → `artifacts.json` の zod schema 整合（enum / ISO 8601 / 相対 path）

## 5. 検証完了の判定

§2 の 1-8 が全 green かつ、§2-9 の grep が「page.tsx に "use client" 追加 0 件」を返すこと。
