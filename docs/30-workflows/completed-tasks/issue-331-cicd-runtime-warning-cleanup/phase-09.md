# Phase 9: 品質保証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 9 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## skill 検証 4 条件

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | Phase 1〜7 で同一の修正方針（top-level vars 削除 + scripts/cf.sh deploy 統一） |
| 漏れなし | PASS | issue #331 残存 2 項目を双方カバー、scope out も列挙済み |
| 整合性あり | PASS | CLAUDE.md 不変条件（wrangler 直接呼び出し禁止）と整合 |
| 依存関係整合 | PASS | 上流（FIX-CF-ACCT-ID-VARS-001 / OpenNext 移行）が completed |

## 静的品質チェック

| 項目 | コマンド | 期待 |
| --- | --- | --- |
| TOML parse | `node -e "require('@iarna/toml').parse(...)"` | 成功 |
| YAML parse | `yamllint .github/workflows/web-cd.yml` | エラー 0 |
| actionlint | `actionlint .github/workflows/web-cd.yml`（インストール時） | エラー 0 |
| line budget | Phase 1〜13 各 <= 600 行 | OK |
| link check | 仕様書内パス参照 | 全て存在 |
| mirror parity | outputs/phase-N/main.md と phase-N.md の Phase 番号一致 | 一致 |

## CI gate 整合

`.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` gate に影響なし（aiworkflow-requirements の indexes はキーワード追加程度）。

## 完了条件

- [ ] skill 検証 4 条件の判定が記載されている
- [ ] 静的品質チェック項目がリスト化されている

## 成果物

- `outputs/phase-09/main.md`

## 目的

本 Phase の目的を、Issue #331 の runtime warning cleanup と Workers deploy contract へ明確に接続する。

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL CI/CD 設定タスクのため、統合テストは static grep、typecheck、wrangler dry-run、GitHub Actions run evidence で代替する。runtime deploy は user approval 後に実行する。

## 依存Phase参照

- Phase 5: `phase-05.md` / `outputs/phase-05/main.md`
