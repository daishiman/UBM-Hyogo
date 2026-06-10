# Phase 12: システム仕様更新サマリ（system-spec-update-summary）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | VISUAL |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

本ワークフローの仕様（観測性向上のコード変更 + 調査）が既存システム仕様・skill reference へ与える影響を Step 1-A / 1-B / 1-C / Step 2 の手順で個別に記録し、workflow-local sync と global skill sync を分離して管理する。本サイクルは `implemented_local_evidence_captured`（ローカル実装とfocused tests完了）であり close-out（Step 1-A〜1-C）も implemented_local_evidence_captured 状態で記録する。

## Step 1-A: 完了タスク記録 / 既存システム仕様（specs/）への影響評価

| 仕様 | 影響 | 結果 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md`（`/me` レスポンス項目） | `/me` の path・レスポンス shape・status 体系は不変（AC-6 / **apps/api 非接触**）。観測性向上は web 表示層と read-only 診断のみ | 仕様変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md`（session / `/me` 解決） | `session-guard` の 401/410 判定・5xx 経路・redirect 経路は不変（AC-3 回帰なし）。web は表示と観測のみ所有（fail-closed 維持） | 仕様変更なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md`（authGateState / session 境界） | session 境界・authGateState は不変 | 仕様変更なし |

Step 1-A 結論: 既存 specs への文面変更は **該当なし**。`/me` 契約・session 境界・status 体系はすべて不変。本格修正（410/5xx/transport/管理者 UX）が仕様に触れ得るが、それらは真因確定後の未タスクであり本サイクルでは specs を変更しない。

## Step 1-B: 実装状況テーブル（implemented_local_evidence_captured）

| 項目 | 状況 |
| --- | --- |
| 実装状況 | **implemented_local_evidence_captured**（ローカル実装・focused Vitest・static screenshot 取得完了。staging 実機調査・commit・PR は user-gated / 後続） |
| 実装ファイル | `apps/web/app/(member)/profile/page.tsx`(編集) / `apps/web/app/(member)/profile/_lib/session-error-display.ts`(新規) / `apps/web/src/components/member/SectionError.tsx`(編集) / `apps/web/src/lib/server-fetch/safe-fetch.ts`(編集) / `scripts/diagnose-profile-session.sh`(新規) |
| テストファイル | `apps/web/app/(member)/profile/page.spec.tsx` / `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts` / `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` / `apps/web/src/components/member/__tests__/SectionError.spec.tsx` |
| apps/api 非接触 | `apps/api/src/**`（`routes/me/index.ts` / `middleware/session-guard.ts` / `me-session-resolver.ts`）は read-only 調査対象。編集しない（AC-6） |
| 実行記録 | focused Vitest / web typecheck / web lint / script syntax / transport failure probe / static screenshot は取得済み。staging 実機調査・認証 cookie 付き診断スクリプト実行・runtime screenshot は user-gated |

## Step 1-C: 関連タスク更新 / skill reference（aiworkflow-requirements）への影響評価

| 参照 | 影響 | 結果 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md`（エラー表示/導線方針） | 既存 `SectionError` primitive と導線方針に従う。`data-cause` は色を持たない裏属性で新規 primitive を生やさない | reference 文面変更なし（本 wave で artifact inventory 同期） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（active ledger） | 本ワークフローを active ledger に登録（本 wave で反映） | 本 wave で更新（本 wave で登録対象） |
| 関連 6 WF（profile-reload-session-404-fix / staging-api-url-and-session-recovery / 06b-A-me-api-authjs-session-resolver / login-stale-link-and-profile-me-safe-fetch / issue-879 / admin-member-detail-status-404-fix） | 解決済み真因（404・loopback・resolver 未接続・safeServerFetch 化・orphan status）を「解決済み前提」として引き継ぐ。本タスクはデフォルト分岐（410/5xx/FAILED）の観測性を足すのみで重複しない | 既存 WF への文面変更なし（前提引き継ぎのみ） |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 新規 architectural pattern を導入しない（`SectionError` props 拡張 + 既存 `safe-fetch` ログ挿入 + read-only スクリプト） | index 変更なし |

## Step 2: 新規 interface / 型定義の追加（判定）

判定: **新規 interface 追加 = 有**（ただし API/IPC surface は不変）。

```ts
// 診断用: error code → 表示/原因コード のマッピング純関数（apps/web 内部・公開 surface 不変）
interface SessionErrorDisplay {
  title: string;
  detail: string;
  retryHref?: string;
  actionHref?: string;
  actionLabel?: string;
  dataCause: "session-404" | "session-410" | "session-5xx" | "session-failed";
}
function mapProfileSessionErrorToDisplay(code: string): SessionErrorDisplay;
```

```ts
// SectionError props 拡張（optional・後方互換）
export interface SectionErrorProps {
  // 既存 props（title/detail/retryHref/actionHref/actionLabel/className）は不変
  dataCause?: string;   // 追加（optional・原因コード可視化）
}
```

### 判断根拠（1 行明記）

- 追加されるのは **`apps/web` 内部の診断用マッピング純関数 `mapProfileSessionErrorToDisplay` と `SectionError` の optional `dataCause` props のみ**で、`/me` の API/IPC surface（path・shape・status 体系）は不変のため、aiworkflow-requirements の正本（reference / indexes）更新は **不要（最小）**。本 waveに artifact inventory へ記録するに留める。

## workflow-local sync

| 対象 | 状況 |
| --- | --- |
| `outputs/phase-9..13/*` + `outputs/phase-12/*`（strict 7） | 本 wave で生成（present） |
| `outputs/phase-11/manual-test-result.md` | 本 wave で生成（present・調査計画 + 証跡主ソース定義） |
| `artifacts.json` / `outputs/artifacts.json` | phase status / `workflow_state = implemented_local_evidence_captured` を byte-identical に保持 |

## global skill sync

| 対象 | 状況 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/*` | 本 wave で artifact inventory 同期。本 wave で artifact inventory / active ledger を同期 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 同上（implemented_local_evidence_captured では drift なし・rebuild 不要） |

## 完了条件

- [x] Step 1-A（既存 specs 影響: 該当なし・apps/api 非接触）を記録
- [x] Step 1-B（実装状況テーブル: implemented_local_evidence_captured）を記録
- [x] Step 1-C（関連タスク更新 / skill reference 影響: 変更なし・前提引き継ぎ）を記録
- [x] Step 2（新規 interface: `mapProfileSessionErrorToDisplay` + `SectionError.dataCause` ありとして記述・API surface 不変の判断根拠 1 行）を記録
- [x] workflow-local sync と global skill sync を別ブロックで記録

## 成果物

- `outputs/phase-12/system-spec-update-summary.md`（本ファイル）

## 参照資料

- `index.md`（不変条件・正本順位）
- `_shared-context.md` §3（スコープ）/ §6（既存 WF との関係）
- `outputs/phase-8/phase-8.md`（`mapProfileSessionErrorToDisplay` 純関数化）
