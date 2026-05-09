# Phase 5: 実装（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`
implementation_mode: `new`

> 本サイクルでの実装成果物は **仕様書 markdown + apps/web Playwright 実ファイル + task-specification-creator skill reference**。コード edit は本サイクル内で完了済みであり、outputs のみで完了扱いにしない。

---

## 1. implementation_mode 判定

| サブタスク | mode | 根拠 |
| --- | --- | --- |
| Stage 0b README | `new` | `apps/web/playwright/README.md` を新規作成 |
| Stage 0c 例外条項 / stale comment 除去 / spec split | `edit/new` | `quality-gates.md`、Playwright config/package script、既存 spec comment を編集し、`profile-readonly-logged-in.spec.ts` を新規作成 |

docs-only ラベルより実態を優先し、実コード・実スキル reference の編集を同一サイクルで完了させる。

---

## 2. 新規 / 修正ファイル一覧（仕様書として確定する成果物）

### 本サイクル PR で commit する workflow docs

| 種別 | path | 操作 | 行数目安 |
| --- | --- | --- | --- |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-4.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-5.md`（本ファイル） | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-6.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-7.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-8.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-9.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-10.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-11.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-12.md` | 新規 | <= 350 |
| docs (new) | `docs/30-workflows/e2e-quality-uplift-stage-0/phase-13.md` | 新規 | <= 350 |
| docs (edit) | `docs/30-workflows/e2e-quality-uplift-stage-0/index.md` | Phase status table 4-13 を `done` に更新 | +10 行差分 |

### 本サイクルで commit される実ファイル

| 種別 | path | 操作 |
| --- | --- | --- |
| code (new) | `apps/web/playwright/README.md` | 新規 7 章構成（Phase 2 §3 確定） |
| code (edit) | `apps/web/playwright.config.ts` | `projects[]` に `evidence-capture` 追加 + `pnpm e2e` script に `--project=desktop-chromium,desktop-firefox,mobile-webkit` 明示 |
| code (delete/rename) | `apps/web/playwright/tests/profile-readonly.spec.ts` | 旧 evidence-only spec を削除し、責務が分かる新ファイルへ移す（R1 案 A） |
| code (new) | `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` | 元 spec の `06b-C` describe を移植、`evidence-capture` project 専用 |
| code (edit) | `apps/web/playwright/tests/profile-visibility-request.spec.ts:2` | stale comment 1 行削除 |
| code (edit) | `apps/web/playwright/tests/profile-delete-request.spec.ts:2` | stale comment 1 行削除 |
| skill (edit) | `.claude/skills/task-specification-creator/references/quality-gates.md` §7.1 (4) / §7.5 | evidence-capture 例外と tier-aware E2E coverage policy を追記 |

---

## 3. コード差分の概要（本サイクルで適用される確定文面）

### 3-A. quality-gates.md §7.1 (4) 例外条項（Phase 2 §4 で確定済）

```
4. **un-skip 不変条件**: ... ランタイムで skip されてはならない。
   - 例外: `apps/web/playwright.config.ts` の `evidence-capture` project は、
     `PROFILE_EVIDENCE_STORAGE_STATE` が set された時のみ意味のある evidence
     キャプチャ専用 project であり、`apps/web/playwright/tests/profile-readonly-logged-in.spec.ts`
     に限って `test.skip(!storageState, ...)` を保持してよい。
     ただし以下を満たすこと:
     a. 標準 `pnpm e2e` の project filter から除外されている
     b. `apps/web/playwright/README.md` で例外として明記されている
     c. tier 判定では coverage 計測対象外（experimental 扱い）
```

### 3-B. playwright.config.ts `projects[]` 追加（本サイクル）

| field | value |
| --- | --- |
| `name` | `evidence-capture` |
| `testMatch` | `**/profile-readonly-logged-in.spec.ts` |
| `use.viewport` | `{ width: 1280, height: 800 }` |
| `use.storageState` | `process.env.PROFILE_EVIDENCE_STORAGE_STATE` |

### 3-C. profile-readonly spec rename/extract（R1 案 A）

| 変更前 | 変更後 |
| --- | --- |
| `profile-readonly.spec.ts`（logged-in `06b-C` evidence 専用だが名前が曖昧） | `profile-readonly.spec.ts` 削除 + `profile-readonly-logged-in.spec.ts`（logged-in `06b-C` 専用） |

### 3-D. stale comment 削除

| path:line | 削除文字列 |
| --- | --- |
| `apps/web/playwright/tests/profile-visibility-request.spec.ts:2` | `// 実体テストは Phase 11 manual smoke で test.describe.skip を解除して活性化する。` |
| `apps/web/playwright/tests/profile-delete-request.spec.ts:2` | `// 実体テストは Phase 11 manual smoke で test.describe.skip を解除して活性化する。` |

### 3-E. README 章構成（Phase 2 §3 確定済、本 phase は再掲なし）

Phase 2 §3 を正本とする。本 phase で重複記述しない。

---

## 4. mirror sync 注意点

| 観点 | 内容 |
| --- | --- |
| skill mirror（`.claude/skills/<id>/references/`） | `task-specification-creator/references/quality-gates.md` と関連 coverage reference を更新済み |
| `aiworkflow-requirements` mirror | Stage 0 実装と Stage 1-3 spec package を quick-reference / resource-map / task-workflow-active / changelog に同期済み |
| index rebuild | 本レビューで手動同期の整合を再確認する。generated index drift が出た場合は別途再生成 |
| CI gate `verify-indexes-up-to-date` | aiworkflow indexes を触っているため、PR 前に再検証が必要 |

---

## 5. 実装に伴うリスクと緩和

| # | リスク | 緩和 |
| --- | --- | --- |
| IR-1 | 仕様書 10 ファイルの行数 cap (350 行) を超える | 各 phase で章を 6-8 個に絞り、表形式で密度を上げる |
| IR-2 | 実 edit が docs と乖離する | Phase 11 / 12 で `git status` / `git diff --stat` と実コマンド証跡を保存する |
| IR-3 | 例外条項の文面が skill reference に未反映のまま Stage 1 が走る | 本サイクルで `quality-gates.md` へ反映済み。Stage 1-3 は `spec_verified_pending_dependency` として実装済み扱いしない |

---

## 6. Phase 5 完了条件

- 本サイクル commit 対象が docs 11 ファイル（10 phase + index.md update）に限定されている ✓
- 各 phase 仕様書の差分概要が Phase 2 §3 / §4 と整合 ✓
- R1 案 A（evidence-only spec rename/extract）が phase-5 §3-C に反映 ✓
- mirror sync 不要判定 ✓

→ Phase 6 着手可。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 5
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

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
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
