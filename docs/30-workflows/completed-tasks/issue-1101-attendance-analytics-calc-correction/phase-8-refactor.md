# Phase 8: リファクタリング

## メタ情報

- task_id: `issue-1101-attendance-analytics-calc-correction`
- 前提: Phase 1（要件・AC）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4〜7（テスト・実装・カバレッジ）
- 本 Phase の責務: 実装後の重複解消・命名整理・navigation drift（旧矢印値残存除去）・SRP 観点の整理を行い、保守性を高める。新機能追加は行わない

## リファクタリング方針

本タスクの変更対象は `apps/api/src/repository/attendance-analytics.ts` / `packages/shared/src/zod/admin-attendance.ts` / `apps/web/src/features/admin/attendance/` に閉じる。Phase 2 設計から「最小差分原則」を採用しつつ、enum 機械可読化に伴う **単一情報源化（DRY）** と **旧矢印値の残存除去（navigation drift 解消）** を本 Phase の中心観点とする。
以下に変更内容を `対象 / Before / After / 理由` テーブル形式で記録する（[Feedback RT-03]）。各タスクは採否を明記する。

## 実行タスク

### タスク 1: `LEGACY_ZONE_MAP` の定数化（旧矢印値の単一情報源化）

旧矢印値（`"0→1"` / `"1→10"` / `"10→100"`）→ 新キーの互換マッピングを、関数内ローカルやインラインの条件分岐ではなく **module スコープの `Record` 定数** に集約する。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `attendance-analytics.ts` の旧矢印互換 | `normalizeZone` 内で `if (raw === "0→1") return "zone_0"` 等のインライン分岐（散在しやすい） | module スコープ `const LEGACY_ZONE_MAP: Record<string, AttendanceZone> = { "0→1": "zone_0", "1→10": "zone_1_9", "10→100": "zone_10_99" }` に集約し `LEGACY_ZONE_MAP[raw] ?? "unknown"` で参照 | 旧矢印値の出現箇所を 1 箇所に閉じ込め、navigation drift（複数箇所に旧値が散る）を防止。Phase 9 grep gate の対象を「定数 1 箇所のみ」に限定できる |

**採否**: **採用**。旧矢印値はこの `LEGACY_ZONE_MAP` 定義 1 行にのみ残し、それ以外の API/web/shared コードからは消す（AC-2）。grep gate（Phase 9）で「`LEGACY_ZONE_MAP` 内の互換マッピングのみが正当な残存」であることを明示する。

### タスク 2: `zones` 配列と `counts` Record キーの単一情報源化（DRY）

`listZoneDistribution` の `counts: Record<AttendanceZone, number>` の初期化キーと `zones: AttendanceZone[]` の列挙順が**手書きで二重管理**になっており、enum 追加（`zone_100_plus`）時の drift リスクがある。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `attendance-analytics.ts` の zone 列挙 | `counts = { zone_0:0, zone_1_9:0, ... }` と `zones = ["zone_0", ...]` を別々に手書き（キー drift リスク） | 単一情報源 `const ZONE_ORDER = ["zone_0","zone_1_9","zone_10_99","zone_100_plus","unknown"] as const satisfies readonly AttendanceZone[]` を定義し、`counts` は `ZONE_ORDER` から `Object.fromEntries(ZONE_ORDER.map(z => [z, 0]))` 相当で派生、`zones` は `ZONE_ORDER` を参照 | zone 集合の単一情報源化。将来の帯追加時に 1 箇所修正で済み、`AttendanceZoneZ` enum との 4 面一致（Phase 2 §5）を構造的に保ちやすい |

**採否（条件付き採用）**: **採用（ただし型安全性を優先）**。`Object.fromEntries` は戻り型が `Record<string, number>` に広がり `Record<AttendanceZone, number>` へ型注釈が必要になるため、型安全が崩れる場合は **`ZONE_ORDER` 配列のみ単一情報源化し、`counts` は明示初期化のまま `satisfies Record<AttendanceZone, number>` で型 gate** する折衷案を採る。いずれの形でも「列挙順の単一情報源は `ZONE_ORDER`」とする。`AttendanceZoneZ.options`（zod の enum options）を `ZONE_ORDER` の正本に流用できる場合はそれを優先する（shared → repository の一方向依存に整合）。

### タスク 3: `zoneFromCount` の境界コメント整理（誤分類再発防止）

旧コードは最終 `else → "unknown"` が「100+ を分類不能に落とす」バグの温床だった。リファクタとして **境界の意図をコメントで固定** し、`unknown` が分類不能フォールバック専用であることを明示する。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `attendance-analytics.ts` `zoneFromCount` | `if (count > 99) return "unknown"`（高頻度帯を unknown 誤分類） | `if (!Number.isFinite(count) \|\| count < 0) return "unknown"; ... return "zone_100_plus";` + コメント「`unknown` は負値/NaN 等の分類不能フォールバック専用。正常な高頻度帯は `zone_100_plus`」 | AC-1/AC-2 の意図を恒久化し、`unknown` の責務過負荷（Phase 2 §0 の真の論点）の再発を防止 |

**採否**: **採用**。コメントは振る舞いを変えないが、根本原因（責務過負荷）の再混入を抑止する保守性向上として記録する。

### タスク 4: `format-attendance.ts` の label 定数 / フォーマット関数の SRP 確認

`format-attendance.ts` は「表示用定数（`ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP`）」と「フォーマット関数（`formatRate` 等）」の 2 責務を持つ。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `format-attendance.ts` のファイル分割 | 単一ファイルに定数 + 関数同居 | （変更しない） | いずれも「出席分析の表示フォーマット・表示文言」という同一ドメイン。分割すると import パス・既存 spec のモジュール参照が変わり差分が拡大する。本タスク scope 内では分割しない |

**採否**: **否（現状維持）**。将来ファイルが肥大化した場合の `attendance-labels.ts` / `attendance-formatters.ts` 分割は未タスク候補（CONST_007: 本サイクル scope 外）として Phase 12 に記録。

### タスク 5: `KpiPanel` の `Card` local コンポーネント昇格確認

`KpiPanel.tsx` の `Card`（`{ label, value, hint, testId }`）は local 定義。unique タイル追加で利用箇所が 5 枚に増える。

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `KpiPanel.tsx` `Card` の shared 昇格 | KpiPanel 内 local 定義 | （変更しない） | 再利用箇所は KpiPanel 単体のみ。`apps/web/src/components/admin/` への昇格根拠なし。不変条件 #9（admin form input の FormField 強制）にも非該当（KPI 表示コンポーネントで input ではない） |

**採否**: **否（現状維持）**。`grep -rn "from.*KpiPanel" apps/web/src/features/admin/attendance` で外部参照が無いことを実装時に確認する。

## リファクタ対象が無い領域（該当なしの明記）

| 領域 | 判定 |
| --- | --- |
| `packages/shared/src/zod/admin-attendance.ts` | enum 再設計・additive field 追加は Phase 5 実装で完結。宣言的 schema のためリファクタ対象 **該当なし** |
| `apps/api/src/routes/admin/attendance.ts` | passthrough のみ・**本タスク非変更**。リファクタ **該当なし** |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | doc 更新は Phase 5 で実施。コードリファクタ対象外 **該当なし** |

## 実行手順

### ステップ 1: `LEGACY_ZONE_MAP` 定数化と旧矢印値の集約（attendance-analytics.ts）

```ts
// module スコープ（旧矢印値はこの 1 箇所にのみ残す = navigation drift 解消）
const LEGACY_ZONE_MAP: Record<string, AttendanceZone> = {
  "0→1": "zone_0",
  "1→10": "zone_1_9",
  "10→100": "zone_10_99",
};

const normalizeZone = (raw: unknown): AttendanceZone => {
  if (typeof raw !== "string") return "unknown";
  if (
    raw === "zone_0" || raw === "zone_1_9" ||
    raw === "zone_10_99" || raw === "zone_100_plus" || raw === "unknown"
  ) {
    return raw;
  }
  return LEGACY_ZONE_MAP[raw] ?? "unknown";
};
```

### ステップ 2: zone 列挙の単一情報源化（attendance-analytics.ts）

```ts
const ZONE_ORDER = [
  "zone_0", "zone_1_9", "zone_10_99", "zone_100_plus", "unknown",
] as const satisfies readonly AttendanceZone[];

// counts は ZONE_ORDER から派生（型は satisfies で gate）
const counts = {
  zone_0: 0, zone_1_9: 0, zone_10_99: 0, zone_100_plus: 0, unknown: 0,
} satisfies Record<AttendanceZone, number>;
const zones: readonly AttendanceZone[] = ZONE_ORDER;
// 既存 filter（unknown は count>0 の時だけ行に残す）は踏襲
```

### ステップ 3: リファクタ後の回帰確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 設計正本 | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-2-design.md` | `LEGACY_ZONE_MAP` / `zones` / `counts` の設計根拠 |
| 変更対象（API） | `apps/api/src/repository/attendance-analytics.ts` | `zoneFromCount` / `normalizeZone` / zone 列挙の単一情報源化 |
| 変更対象（shared） | `packages/shared/src/zod/admin-attendance.ts` | `AttendanceZoneZ.options` を `ZONE_ORDER` 正本に流用検討 |
| 変更対象（web） | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` / `components/KpiPanel.tsx` | label 定数 / Card local 維持判定 |
| grep gate | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-9-qa.md` | `LEGACY_ZONE_MAP` 以外の旧矢印値残存ゼロ確認 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/api/src/repository/attendance-analytics.ts` | 編集 | `LEGACY_ZONE_MAP` 定数化（旧矢印値の単一情報源化）/ `ZONE_ORDER` による zone 列挙 DRY 化 / `zoneFromCount` 境界コメント |
| 採否判定記録 | 文書 | タスク 4（label 分割）/ タスク 5（Card 昇格）= 否（現状維持）。リファクタ対象なし領域の明記 |

## 統合テスト連携

- Phase 9 QA で `focused vitest` を実行し、リファクタによる回帰がないことを確認する。
- `LEGACY_ZONE_MAP` 定数化により、Phase 9 grep gate（`"0→1"` 等の残存検出）が「定数 1 箇所のみ正当残存」へ収束する。
- zone 列挙の単一情報源化（`ZONE_ORDER`）が Phase 9 の「4 面一致確認（enum / `zoneFromCount` / `ZONE_LABEL` / doc）」の構造的担保となる。

## 完了条件

1. 旧矢印値（`"0→1"` 等）が `LEGACY_ZONE_MAP` 定数 1 箇所に集約され、それ以外の API/web/shared コードから除去されている（navigation drift 解消）。
2. zone 列挙（`zones` / `counts`）が `ZONE_ORDER`（または `AttendanceZoneZ.options`）を単一情報源として DRY 化されている。
3. 各リファクタ観点に `対象 / Before / After / 理由` テーブルと採否判定（採用 / 否（現状維持）/ 該当なし）が記録されている（[Feedback RT-03]）。
4. `pnpm typecheck` / `pnpm lint` / focused vitest が全 green（リファクタによる回帰なし）。
5. label 分割・`Card` 昇格は「否（現状維持）」、リファクタ対象なし領域は「該当なし」として明記されている。
