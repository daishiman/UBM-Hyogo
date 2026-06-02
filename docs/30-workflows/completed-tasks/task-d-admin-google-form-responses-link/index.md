# task-d-admin-google-form-responses-link

## 概要

admin サイドバー nav に、Google Form の回答一覧/編集画面を**別タブで開く外部リンク**を 1 項目追加する
実装仕様。`ShellNavItem.external?` を追加し、external 時のみ `<a target="_blank" rel="noopener noreferrer">`
を描画する案A を採用。href は `FORM_RESPONSES_EDIT_URL` 定数経由（ハードコード禁止）、external 項目は
active 判定対象外、`↗` + sr-only「（外部リンク）」で判別する。

- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `VISUAL`（screenshot は staging 認証必須で user-gated・local jsdom render 証跡を主とする）
- implementation_status: `implemented_local_evidence_captured`
- Phase 12 strict 7: `outputs/phase-12/` に配置
- Phase 13: commit / push / PR は user-gated

## 実装区分の判定根拠

本 workflow は `apps/web` の shell コンポーネント（サイドバー nav）・定数・icon・型を変更する**実装仕様書**である。
「外部リンクを追加する」「別タブで開く」「active 判定対象外にする」はコード変更なしで達成不可能なため docs-only ではない。
実装は親 PR `member-publish-recovery-form-ops-and-admin-link`（PR #1064 / commit `745c95115`）で dev に landed 済み
（`git diff origin/dev...HEAD -- apps/web` は空）。本サイクルは landed 実装の**正本記述（verify_existing）**であり、
apps 差分を新規発生させない。

## 受け入れ条件

| ID | 条件 | 根拠 |
| --- | --- | --- |
| AC-D1 | admin サイドバー項目クリックで Form 編集 URL が別タブで開く（元画面は遷移しない） | `phase-2.md` / `phase-5.md` |
| AC-D2 | 外部リンクは `target="_blank"` + `rel="noopener noreferrer"`（不変条件 #7） | `phase-4.md` / `phase-5.md` |
| AC-D3 | href は `FORM_RESPONSES_EDIT_URL` 定数経由（ハードコード禁止） | `phase-2.md` / `phase-5.md` |
| AC-D4 | 外部リンク判別（`↗` + sr-only）かつ active 判定対象外 | `phase-4.md` / `outputs/phase-11/main.md` |

## 対象ファイル

| 区分 | パス | 状態 |
| --- | --- | --- |
| 定数 | `apps/web/src/lib/constants/form.ts` | 実装済み（landed） |
| nav config | `apps/web/src/components/shell/shell-config.ts` | 実装済み（landed） |
| icon | `apps/web/src/components/shell/icons.tsx` | 実装済み（landed） |
| 描画 | `apps/web/src/components/shell/SidebarNavItem.tsx` | 実装済み（landed） |
| 定数 spec | `apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | 実装済み（landed） |
| 描画 spec | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 実装済み（landed） |
| nav config spec | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 実装済み（landed・external 検証追加） |

## Phase 構成

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/requirements.md` / `phase-1.md` | completed |
| 2 | `phase-2.md` | completed |
| 3 | `phase-3.md` | completed |
| 4 | `phase-4.md` | completed |
| 5 | `phase-5.md` | completed |
| 6 | `phase-6.md` | completed |
| 7 | `phase-7.md` | completed |
| 8 | `phase-8.md` | completed |
| 9 | `phase-9.md` | completed |
| 10 | `phase-10.md` / `outputs/phase-10/final-review-result.md` | completed |
| 11 | `phase-11.md` / `outputs/phase-11/*` | completed |
| 12 | `phase-12-compliance.md` / `outputs/phase-12/*` | completed |
| 13 | `phase-13.md` | blocked: user approval required |

## 依存関係

Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 の直列。

## VISUAL 境界

サイドバー nav の構造・aria・別タブ遷移が対象。screenshot は staging 認証必須のため user-gated（未取得が正）。
主証跡は `apps/web` の jsdom render unit（`SidebarNavItem.spec.tsx`）と純関数 unit（`shell-config.spec.ts`）、
定数 unit（`form-responses.spec.ts`）。D1 / API / Google Form schema は対象外。
