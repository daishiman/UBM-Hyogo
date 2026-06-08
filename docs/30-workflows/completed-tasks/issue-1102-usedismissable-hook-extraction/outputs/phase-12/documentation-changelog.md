---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-06-06
task_id: issue-1102-usedismissable-hook-extraction
issue: 1102
issue_state: CLOSED
visual_category: NON_VISUAL
implementation_mode: new
---

# ドキュメント更新履歴 — issue-1102-usedismissable-hook-extraction

> 本タスク（`implemented_local_evidence_captured` / 実装仕様書 / NON_VISUAL / `implementation_mode=new`）で発生した
> ドキュメント・仕様・skill sync の更新履歴。本 wave は **spec 作成のみ**であり、
> `apps/web` への実コード変更と focused vitest は実施済み。commit・PR・Issue mutation は user-gated。
> 各 Step の判定を「該当なし」も含めて個別に明記する。

---

## Step 1-A: 完了タスク記録（system-spec / workflow ledger への完了反映）

| 種別 | 対象 | 判定 |
| --- | --- | --- |
| 本 workflow root の記録 | `docs/30-workflows/completed-tasks/issue-1102-usedismissable-hook-extraction/` | **implemented_local_evidence_captured として記録**。`index.md` / `artifacts.json` / `outputs/artifacts.json` に状態を明記 |
| aiworkflow discoverability | `.claude/skills/aiworkflow-requirements/` | artifact inventory / quick-reference / resource-map / task-workflow-active を同期 |

> 本タスクは spec 作成までを責務とするため、「完了タスク」としての product log 反映は行わず、
> commit / push / PR は Phase 13 user gate として残す。

## Step 1-B: 実装状況テーブル更新

| 対象 | 反映前 | 反映後 | 判定 |
| --- | --- | --- | --- |
| `useDismissable` hook の実装状況 | 未着手（rule of three 未到達と判断され follow-up 温存） | **implemented**（hook 本体 + unit spec 追加） | focused vitest PASS |
| `SidebarUserMenu.tsx` の dismiss ロジック | inline `useEffect`（landed・親 WF で実装済） | hook 呼び出しへ移行 | existing spec PASS |
| `DensityToggle.client.tsx` の dismiss ロジック | inline `useEffect`（landed・コピー実装） | hook 呼び出しへ移行 | existing spec PASS |

> 実装状況の正本は `artifacts.json` の `workflow_state` = `implemented_local_evidence_captured`。
> 実装完了（コード反映）への遷移は本 wave のスコープ外。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 反映前 | 反映後 |
| --- | --- | --- |
| 親 follow-up `sidebar-footer-pinning-and-account-popover-ux-followup-001-usedismissable-hook-extraction` | `pending`（unassigned-task / rule of three 未到達で温存） | **実装済**（本 root が follow-up を実装）。元 unassigned-task は履歴として原位置に保持し、`source_unassigned_task` として参照記録する |
| 親 WF `sidebar-footer-pinning-and-account-popover-ux` | completed-tasks 済（C3 で SidebarUserMenu dismiss landed） | 変更なし（依存元として参照のみ） |

> 元 unassigned-task を物理的に consume（移動/削除）せず参照保持する理由:
> 本タスクは issue #1102 を正本 trigger として起票された独立 root であり、
> unassigned-task の物理消費は親 WF 側の close-out 管轄のため。
> stale-reference は発生しない（phase12-compliance §8 参照）。

## Step 2: system spec 更新

**該当なし。**

- `docs/00-getting-started-manual/specs/` 配下への正本仕様更新は **なし**。
- 理由: 本タスクは `apps/web` ローカルの UI util hook 抽出（挙動不変リファクタ）であり、
  新規 IPC / 公開型 / API contract / D1 schema / Google Form schema を一切追加しない。
- `useDismissable` の API（`DismissReason` / `UseDismissableOptions`）は apps/web 内部 interface に閉じ、
  システム横断 spec への昇格対象ではない。
- system-spec-update-summary.md の Step 2 判定 = **N/A** と整合。

---

## workflow-local 同期（本 wave で実施）

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `index.md` | workflow root index（結論サマリ / hook シグネチャ / scope / 不変条件 / Phase 索引） |
| 新規 | `artifacts.json` / `outputs/artifacts.json` | root / outputs metadata（parity 一致・`implemented_local_evidence_captured`） |
| 新規 | `phase-1-requirements.md` 〜 `phase-10-final-review.md` | Phase 1-10 実装仕様書本文 |
| 新規 | `phase-12-documentation.md` | Phase 12 ドキュメント仕様本体（root 直下・索引） |
| 新規 | `phase-13-pr.md` | Phase 13 PR ドラフト（user-gated） |
| 新規 | `outputs/phase-11/manual-test-result.md` | NON_VISUAL 代替証跡（focused vitest PASS + 挙動不変判定根拠） |
| 新規 | `outputs/phase-12/*.md` | Phase 12 strict 7 成果物（本ファイル含む） |

## global skill sync（本 wave では本体改変なし・BEFORE-QUIT-003）

| 対象 | 本 wave の扱い | 実装 close-out wave での予定 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | **未改変** | 実装 landed 後に current facts を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` | **未改変** | 実装 close-out 時に entry 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1102-usedismissable-hook-extraction-artifact-inventory.md` | **未作成** | 実装 close-out 時に新規作成 |
| `.claude/skills/*/LOGS/_legacy.md` / `SKILL-changelog.md` | **未追記** | 実装 close-out 時に sync log 追記 |
| topic-map / keywords indexes（`indexes:rebuild`） | **未再生成**（drift なし） | skill 本体改変後に `pnpm indexes:rebuild` |

> skill 本体は改変しない。aiworkflow discoverability は本 wave で同期済み。
> 本 wave で skill 本体を改変しないことにより、index 再生成 drift は構造的に発生しない。
> workflow-local 同期（本 root 配下のファイル生成）と global skill sync（`.claude/skills/` 配下）を
> [BEFORE-QUIT-003] に従い別ブロックで分離記録する。

---

## 該当なし（明示記録）

- 新規 D1 migration: なし（UI 層のみ・DB 非該当）
- API endpoint 追加 / 変更: なし（既存 endpoint surface 不変）
- Google Form schema 変更: なし
- 公開 system spec 更新: なし（Step 2 = N/A）
- skill 本体改変: なし（skill-feedback-report.md に提案のみ記録）
