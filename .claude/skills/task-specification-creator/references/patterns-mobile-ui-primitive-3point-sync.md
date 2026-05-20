# Patterns — mobile UI primitive 3-point sync（filter / picker）

> origin: Issue #276 mobile FilterBar tag picker（2026-05-20）
> 関連 lesson: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-276-mobile-filterbar-tag-picker-2026-05.md`
> 関連 prototype 系 pattern: `patterns-prototype-driven-css.md`
> 関連 phase-12 系 pattern: `patterns-phase12-sync.md`

公開ページに **「候補列 + 選択済み列 + mobile 折りたたみ summary」** の 3 primitive をまとめて追加し、shared zod / API / web / spec を同一 wave で同期させるための pattern。filter / picker / facet UI を導入する後発タスクは、本 pattern を起点に Phase 4-12 を組む。

## 1. 4-layer sync 順序固定

shared schema を起点に contract を確定させてから API → web の順で実装する。並走させると Phase 4-6 で contract drift が顕在化する。

| 順序 | 層 | 対象ファイル例 | 確定対象 |
|----|----|----|----|
| 1 | shared zod | `packages/shared/src/zod/viewmodel.ts` + `viewmodel.spec.ts` | response shape / 件数 `.max(N)` |
| 2 | API repository | `apps/api/src/repository/*.ts` | aggregate query / 公開境界 WHERE |
| 3 | API use-case | `apps/api/src/use-cases/**/*.ts` + `__tests__/` | list + aggregate を 1 response にまとめる |
| 4 | API contract test | `apps/api/src/routes/**/*.contract.spec.ts` | fixture を新 shape に追従 |
| 5 | web fetcher | `apps/web/src/lib/api/*.ts` + `__tests__/` | zod parse + 型 export |
| 6 | web component | `apps/web/src/components/**/*.client.tsx` | primitive 3 分割 + composition root |

> shared zod の `.max(N)` で件数を強制すると、API 側の forgotten truncate が parse 段階で fail-closed になる。

## 2. 3-point primitive split rule

filter / picker UI は責務を 3 component に分割し、`MemberFilters.client.tsx` 相当の composition root から組み立てる。

| primitive | 責務 | 主要 prop / ARIA |
|----|----|----|
| `<*Picker>` 候補列 | 選択可能な候補 chip を列挙 | `options[]`, `selected[]`, `max`, `onToggle`, `role="switch"` + `aria-checked` + `aria-disabled` |
| `<Selected*Bar>` 選択済み列 | 選択中要素の表示 + 個別削除 + clear-all | `selected[]`, `onRemove`, `onClear` |
| `<*SummaryMobile>` mobile 折りたたみ | 折りたたみ時の summary 行 + expand toggle | `summaryLabel`, `expanded`, `onToggleExpand` |

composition root には URL state ↔ local state の対応関係と business logic（toggle / clear / limit）を集約し、子 primitive には business logic を持ち込まない。

## 3. URL canonical vs local UI state matrix

「他者と share した時に再現してほしいか」が判断軸。意味的 state は URL canonical、表示的 state は local。

| state 種類 | 例 | 配置 | 備考 |
|----|----|----|----|
| 検索条件 | `?q=…` | URL canonical | 1 値 |
| 絞り込み | `?tag=ai&tag=design` | URL canonical | **反復 query** で多値表現 |
| 並び順 | `?sort=name` | URL canonical | enum 制約を shared zod 側で持つ |
| ページング | `?page=2` | URL canonical | offset / cursor は spec で固定 |
| 折りたたみ | mobile expanded | local（useState） | share された URL で expanded が常時 true になる弊害を回避 |
| hover / focus | tooltip / dropdown open | local | URL に乗せると history が暴発 |
| dialog open | confirm dialog | local | route ベースで持つ場合のみ URL |

## 4. toggle + 上限制約の a11y 4 点セット

「toggle で表現」かつ「N 件上限」が同居する chip / pill primitive では、以下 4 点を必須セットとする。

- `role="switch"`（checkbox ではなく toggle 意味）
- `aria-checked={isSelected}`
- `aria-disabled={reached && !isSelected || undefined}`（DOM `disabled` は使わない）
- 上限到達時に `aria-live="polite"` hint（例: 「これ以上選択できません（上限 N 件）」）

`onClick` 側でも `if (isDisabled) return;` を入れ、event を二重で塞ぐ。`disabled` 属性ではなく `aria-disabled` を選ぶ理由は、focus を維持して screen reader が「無効化された理由」を読み上げ可能にするため。

## 5. 4-spec sync matrix

UI primitive を追加するたびに、関連 system spec を 4 軸で同時更新する。`outputs/phase-12/system-spec-update-summary.md` に 4 行マトリクスを書いて漏れを潰す。

| 軸 | 対象 spec | 更新ポイント |
|----|----|----|
| API contract | `01-api-schema.md` | response shape / 件数制約 / 公開境界 |
| UI props | `09-ui-ux.md` | primitive 名 / props / state vocabulary / ARIA 要件 |
| 画面 blueprint | `09e-screen-blueprints-public.md`（公開）/ `09g-…-admin.md`（管理） | primitive 配置 + URL state |
| feature 仕様 | `12-search-tags.md` 等の機能別 spec | UX 条件 / 上限 / fallback |

> 4 ファイル全てを同一 commit で更新できなくても良いが、Phase 12 close-out 時には `system-spec-update-summary.md` で **4 行の更新表**が揃っていることを必須とする。

## 6. mobile visual evidence canonical 4-shot

折りたたみ + 上限制約 + 多値選択を持つ filter UI の Phase 11 visual evidence は、最低 4 枚を canonical とする。

| ファイル | viewport | URL state | 撮影意図 |
|----|----|----|----|
| `mobile-initial.png` | mobile | 初期（filter 折りたたみ） | landing 時の見やすさ |
| `mobile-expanded.png` | mobile | 折りたたみ展開済み | filter 操作可能 state |
| `mobile-limit-reached.png` | mobile | 上限到達（5 件選択済み） | aria-disabled hint の visual |
| `desktop-picker-and-selected.png` | desktop | 候補 + 選択済みの並置 | desktop layout 回帰 |

`outputs/phase-11/evidence/<above>.png` に固定 path で保存し、`outputs/phase-11/screenshot-plan.json` で path + viewport を宣言する。

## 6.5. dev 取り込み時の index 同期 3 点（stash-pop conflict 解消手順）

本 pattern を適用する long-running task では、実装途中で `origin/dev` を取り込む際、未コミットの skill index 追記が `git stash` → `git merge dev` → `git stash pop` 経路で 3-way conflict（`<<<<<<< Updated upstream` / `||||||| Stash base` / `>>>>>>> Stashed changes`）に発生しやすい。発生時は次の 3 点を固定手順とする。

1. **union 解消**: 該当 index ファイル（`indexes/{quick-reference,resource-map,topic-map}.md`, `references/task-workflow-active.md`）は **Updated upstream 側 + Stashed changes 側の両方を採用** し、Stash base 側を破棄する。これにより dev で merge された他 workflow entry（例: Issue #775 entry）と本タスクで追加する entry（例: Issue #276 entry）が両方残る。
2. **indexes 再生成**: 解消後に `pnpm indexes:rebuild` を必ず実行し `keywords.json` を再生成する（手書きの union では keyword 索引が drift し、`verify-indexes-up-to-date` CI gate が fail する）。
3. **pre-flight gate**: commit / push の前に `bash scripts/verify-pr-ready.sh`（verify:phase12-compliance / gate-metadata:validate / indexes:rebuild drift の 3 点を一括）を実行する。pre-push hook 段階で初めて落ちると再 fix の commit が増え PR ノイズになる。

なお `pnpm sync:resolve`（`scripts/sync/resolve-skill-merge-conflicts.sh`）は `MERGE_HEAD` 検出ロジックのため stash-pop コンフリクトでは `no merge in progress` で早期 exit する。stash-pop 起因では本手順を手動適用する（自動化未対応）。

参照: `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-276-mobile-filterbar-tag-picker-2026-05.md` § L-I276-008

## 7. Phase 12 close-out 必須同期対象（本 pattern 適用時）

本 pattern を採用したタスクの Phase 12 close-out では、以下を同一 wave で同期する。`patterns-phase12-sync.md` の一般則に加えて UI primitive 固有の追加項目。

- shared zod / API / web / spec の 4 層 4 spec が `outputs/phase-12/system-spec-update-summary.md` に表で記載されている
- `outputs/phase-11/evidence/` に 4 shot が物理存在
- aiworkflow-requirements `lessons-learned/lessons-learned-<id>-<topic>-<yyyy-mm>.md` に教訓を記録（本 pattern を引用）
- aiworkflow-requirements `references/workflow-<id>-<topic>-artifact-inventory.md` を生成
- aiworkflow-requirements `changelog/<yyyymmdd>-<id>-<topic>.md` を生成
- aiworkflow-requirements `indexes/{resource-map,quick-reference,topic-map}.md` + `indexes/keywords.json` に workflow を追記
- `docs/30-workflows/LOGS.md` に 1 行を追記
- 元 unassigned-task は **物理削除しない**。`status: consumed` + `canonical_workflow:` pointer に書き換え、`completed-tasks/unassigned-task/` 配下へ rename する

## 参照

- 元タスク: `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/`
- 元 unassigned-task: `docs/30-workflows/completed-tasks/unassigned-task/task-06a-followup-003-mobile-filterbar-tag-picker.md`
- 関連 lesson: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-276-mobile-filterbar-tag-picker-2026-05.md`
- 関連 pattern: `patterns-phase12-sync.md`, `patterns-prototype-driven-css.md`, `patterns-guidelines.md`
