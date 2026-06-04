# Phase 12: システム仕様更新サマリ（system-spec-update-summary）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

本ワークフローの実装が既存システム仕様・skill reference へ与える影響を Step 1-A / 1-B / 1-C / Step 2 の手順で個別に記録し、workflow-local sync と global skill sync を分離して管理する。

## Step 1-A: 既存システム仕様（specs/）への影響評価

| 仕様 | 影響 | 結果 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md`（`/me` レスポンス項目） | `/me` のレスポンス shape・path は不変（AC-7）。trailing-slash 正規化はルート解決層の追加のみ | 仕様変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md`（session / `/me` 解決） | `sessionGuard` の 401/410 判定・redirect 経路は不変（AC-3） | 仕様変更なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md`（authGateState / session 境界） | session 境界・authGateState は不変 | 仕様変更なし |

Step 1-A 結論: 既存 specs への文面変更は **該当なし**。`/me` の契約・session 境界は不変。

## Step 1-B: 実装状況（spec_created）

| 項目 | 状況 |
| --- | --- |
| 実装状況 | implemented_local_evidence_captured（コード実装済み・focused Vitest PASS） |
| 実装ファイル | `apps/api/src/middleware/trailing-slash.ts`(新規) / `apps/api/src/index.ts`(編集) / `apps/web/app/api/me/[...path]/route.ts`(編集) / `apps/web/app/(member)/profile/page.tsx`(編集) / `apps/web/src/components/member/SectionError.tsx`(編集) |
| テストファイル | `apps/api/src/middleware/__tests__/trailing-slash.spec.ts` / `apps/api/src/__tests__/me-route-mount.integration.spec.ts` / `apps/web/app/api/me/[...path]/route.route.spec.ts` / `apps/web/app/(member)/profile/page.spec.tsx` / `apps/web/src/components/member/__tests__/SectionError.spec.tsx` |
| 実行記録 | API focused Vitest 2 files / 9 tests PASS、web focused Vitest 3 files / 16 tests PASS、static UI contract screenshot captured、`pnpm typecheck` PASS、`pnpm lint` PASS。staging runtime screenshot は user-gated |

## Step 1-C: skill reference（aiworkflow-requirements）への影響評価

| 参照 | 影響 | 結果 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md`（エラー表示/導線方針） | 既存 `SectionError` primitive と導線方針に従う。新規 primitive を生やさない | reference 文面変更なし（spec_created 段階では sync 不要） |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 本ワークフローは新規 architectural pattern を導入しない（middleware は既存 `securityHeaders`/`corsFromEnv` と同列追加） | index 変更なし |

## Step 2: 新規 interface / 型定義の追加

該当 **あり**。`SectionError` props 拡張のみ。

```ts
export interface SectionErrorProps {
  title?: string;
  detail?: string;
  retryHref?: string;
  actionHref?: string;   // 追加（optional）
  actionLabel?: string;  // 追加（optional）
  className?: string;
}
```

- `actionHref` / `actionLabel` は optional 追加であり、既存呼び出し（`retryHref` のみ）は後方互換。
- 新規コンポーネント・新規 primitive・新規 endpoint・新規 D1 schema は無し。trailing-slash middleware は `MiddlewareHandler` を返す既存 Hono パターンに従い、新規公開型は生やさない。

## workflow-local sync

| 対象 | 状況 |
| --- | --- |
| `outputs/phase-12/*`（strict 7） | 本 wave で生成（present） |
| `outputs/phase-11/manual-test-result.md` | 本 wave で生成（present） |
| `artifacts.json` / `outputs/artifacts.json` | phase status / workflow_state = implemented_local_evidence_captured を byte-identical に保持 |

## global skill sync

| 対象 | 状況 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/*` | artifact inventory / active ledger を同 wave で同期 |
| `.claude/skills/aiworkflow-requirements/indexes/*` | quick-reference / resource-map へ同 wave 登録 |

## 完了条件

- [x] Step 1-A（既存 specs 影響: 該当なし）を記録
- [x] Step 1-B（実装状況: spec_created）を記録
- [x] Step 1-C（skill reference 影響: 変更なし）を記録
- [x] Step 2（新規 interface: `SectionError` props 拡張ありとして記述）を記録
- [x] workflow-local sync と global skill sync を別ブロックで記録

## 成果物

- `outputs/phase-12/system-spec-update-summary.md`（本ファイル）

## 参照資料

- `index.md`（不変条件・正本順位）
- `outputs/phase-3/phase-3.md`（`SectionErrorProps` 拡張定義）
