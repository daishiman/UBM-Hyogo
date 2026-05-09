# Phase 9: 品質保証

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. 受け入れ条件 vs 実装結果対応表

| AC ID | 出典 | 検証手段 | 期待 |
|-------|------|---------|------|
| AC-1a-01 | phase-1.md §1a-3 | spec 実行 / `not.toContainText(LEAK_PROBE_EMAIL)` | green |
| AC-1a-02 | 同 | `not.toContainText(/@/)` | green or 縮退判定 |
| AC-1a-03 | 同 | 非 public consent member 含む seed | vacuous 受容（Stage 2 へ） |
| AC-1a-04 | 同 | 既存 desktop / mobile 緑維持 | green |
| AC-1b-01 | phase-1.md §1b-3 | round-trip 後 `[data-pending-type=visibility_request]` visible | green |
| AC-1b-02 | 同 | `/api/me` mock response に該当 type 含む | mock hit 確認 |
| AC-1b-03 | 同 | delete 版も同様 | green |
| AC-1b-04 | 同 | TC-E-01..06 / 09 緑維持 | green |

## 2. 不変条件遵守チェック

| ID | 内容 | 検証 | 結果欄 |
|----|------|------|-------|
| INV-3 | `responseEmail` system field | 1a guard で UI 露出を継続検出 | OK |
| INV-PUB | 非 public consent PII を public route に出さない | 1a `/@/` probe で補助検出 | OK |
| INV-API-ONLY | `apps/web` から D1 直接アクセス禁止 | spec 改修は API mock のみ・D1 binding 触らず | OK |
| INV-PROTO | 新規 primitive を生やさない | 新規 testId / component 追加なし | OK |

## 3. CONST_007 単一サイクル整合再確認

| 項目 | 結果 |
|------|------|
| 触る spec ファイル数 | 3（既存） |
| 新規ファイル | 0 |
| production code 変更 | 1（`apps/web/src/styles/tokens.css` の accent contrast 最小修正） |
| schema / endpoint 追加 | 0 |
| design token / HEX 改修 | 1（既存 axe contrast failure 解消の最小 token 修正。HEX 移行はなし） |
| 範囲外 route への波及 | なし |

## 4. CI gate チェック

| gate | 期待 | コマンド |
|------|------|---------|
| typecheck | green | `mise exec -- pnpm typecheck` |
| lint | green | `mise exec -- pnpm lint` |
| playwright smoke | green | 既存 CI job |
| `verify-design-tokens` | green | 本 stage 関与なし |
| `verify-indexes-up-to-date` | green | indexes 改修なし |

## 5. governance / branch protection

| 項目 | 値 |
|------|----|
| base branch | `dev` |
| required_pull_request_reviews | `null`（solo 運用） |
| required_status_checks | 既存 set |
| linear history | required |

## 6. レポート生成

| 項目 | 形式 |
|------|------|
| 追加 test 件数 | 3（1a×1, 1b-A×1, 1b-B×1） |
| 追加 LOC | < 100 行（spec のみ） |
| 既存 fail 件数 | 0 |
| flaky 観測 | Phase 8 §3 の結果を記載 |

## 7. Phase 10 入口条件

- [x] §1 AC 8 件すべて green / 受容判定済
- [x] §2 不変条件 4 件すべて OK
- [x] §4 CI gate 状態を記録済（PR/CI 実行は Phase 13 user gate、local E2E は green evidence として記録）

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 9
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 12 evidence に反映し、Phase 11 は実行ログ・skip count・runner version として分離する。

## 統合テスト連携

- NON_VISUAL implementation phase は Playwright assertion 差分、spec completeness、grep gate、artifact parity を検証する。
- E2E runtime 実行結果は outputs/phase-11/evidence に保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- apps/web/playwright/tests/public-flow.spec.ts、profile-visibility-request.spec.ts、profile-delete-request.spec.ts の assertion 差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
