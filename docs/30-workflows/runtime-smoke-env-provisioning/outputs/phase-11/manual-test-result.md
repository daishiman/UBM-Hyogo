# Phase 11: 手動テスト（NON_VISUAL）

## NON_VISUAL 宣言（WEEKGRD-03 準拠）

| 項目 | 内容 |
|------|------|
| タスク種別 | NON_VISUAL（backend API + CI workflow + shell script + ops runbook） |
| 非視覚的理由 | UI レンダリングを伴わない（service-token endpoint / workflow / shell / runbook） |
| 代替証跡 | spec レビューチェックリスト + 静的検証結果（本ファイル）+ `outputs/phase-04/test-plan.md`（自動テスト計画） |
| スクリーンショット | UI/UX 変更なしのため不要。`screenshots/.gitkeep` も作成しない |

## 証跡の主ソース（Feedback 4 準拠）

| カテゴリ | ソース | 件数 / 状態 |
|---------|--------|-----------|
| 自動テスト計画 | `outputs/phase-04/test-plan.md` | 39 テストケース定義 |
| 追加 fail path | `outputs/phase-06/test-extension.md` | 7 件 |
| spec レビュー | 本ファイル §レビュー結果 | 全項目 PASS |

## レビューチェックリスト（spec only）

| # | 観点 | 結果 |
|---|------|------|
| 1 | `index.md` に概要 / 真因 / 解決策 / Phase 構成 / 不変条件 / 参照が揃う | PASS |
| 2 | `artifacts.json` の metadata / implementation_targets / evidence / phases が完備 | PASS |
| 3 | Phase 1〜13 の全 markdown ファイルが存在 | PASS |
| 4 | service-token endpoint の HMAC / claim / rate limit / 監査が Phase 2 に完全記述 | PASS |
| 5 | smoke runner 拡張仕様が production read-only 限定で記述 | PASS |
| 6 | production workflow 構造が staging と対称で記述 | PASS |
| 7 | allowlist 拡張行が正確（`production-runtime-smoke: PROD_API_BASE PROD_ADMIN_BEARER PROD_MEMBER_ID PROD_ME_BEARER`） | PASS |
| 8 | provision script rename 仕様が記述 | PASS |
| 9 | 4 runbook（staging / production env provisioning / service-token / D1 migration）が存在 | PASS |
| 10 | bearer 値 / API token 値が文書本文に未混入 | PASS（`grep` 確認） |
| 11 | user-gated 操作（secret 投入 / workflow rerun / commit / push / PR）が `artifacts.json` に列挙 | PASS |
| 12 | CLAUDE.md 不変条件（D1 binding / wrangler 経由 / *.spec.ts 命名）が遵守 | PASS |

## 実地操作不可項目（Feedback BEFORE-QUIT-001 準拠）

| 項目 | 理由 | 代替記録 |
|------|------|---------|
| 実 secret 投入 | user-gated（本タスクは spec only） | `runbooks/runtime-smoke-env-provisioning-*.md` の手順記載 |
| 実 D1 migration apply | user-gated | `runbooks/d1-migration-apply.md` の手順記載 |
| 実 workflow rerun | user-gated | runbook + index.md の Phase 13 セクション参照 |
| 実 service-token 発行 | user-gated（実装後に runbook 経由で行う） | `runbooks/service-token-issuance.md` |

## 静的検証コマンド（実行可能項目）

```bash
# spec ファイル link 解決
grep -rE '\]\([^)]+\)' docs/30-workflows/runtime-smoke-env-provisioning/

# secret 値混入チェック
grep -rE '(eyJ[A-Za-z0-9_-]{20,}|sk-|ghp_|cfp_[A-Za-z0-9]{20,})' \
  docs/30-workflows/runtime-smoke-env-provisioning/

# artifacts.json validity
node -e "JSON.parse(require('fs').readFileSync('docs/30-workflows/runtime-smoke-env-provisioning/artifacts.json','utf8'))"
```

## 完了条件

- NON_VISUAL 宣言（種別 / 非視覚的理由 / 代替証跡）が記録されている
- 自動テスト件数と spec レビュー結果が記録されている
- 実地操作不可項目と代替記録が明示されている

## 成果物

- `outputs/phase-11/manual-test-result.md`（本ファイル）

## 次 Phase 入力

- Phase 12: 実装ガイド / changelog / 未タスク / skill-feedback
