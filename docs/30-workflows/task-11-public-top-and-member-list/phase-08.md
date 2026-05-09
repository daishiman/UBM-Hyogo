# Phase 8: DRY 化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

重複検出と過剰抽象化のバランスを記録し、CONST_003（タスク特性最適化）を満たす。

## 実行タスク

- [ ] 重複検出と対応方針を表で記録する
- [ ] YAGNI 適用の判断を残す

## 参照資料

- Phase 5 §実装手順 / Phase 2 §関数シグネチャ

## 成果物

- `outputs/phase-08/main.md`

## 統合テスト連携

- DRY 化判断で共通化しない箇所は focused Vitest の責務を明確にする。
- token / D1 / process.env / skip grep gate は Phase 9/11 に接続する。

## 重複検出と対策

| 観点 | 検出 | 対応 |
| --- | --- | --- |
| `Hero` / `Stats` / `ZoneIntro` / `Timeline` の section wrapper | 共通 `<section>` + `data-component=...` パターン | 共通 component に抽出**しない**（4 component 用途が異なり、内部 markup も別物） |
| token 直書き | `var(--ubm-color-*)` 文字列が複数ファイル散在 | task-08 token 確定済みのため `var(--ubm-color-*)` 直書きを許容。token 経由 utility class（task-09）が固まったら refactor task で巻き取る |
| `MemberCard` × density 3 形態 | 単一 component 内で分岐 | 1 component で `density` props 切替（過剰分割しない） |
| `MemberGrid` / `MemberTable` の link `/members/{id}` | 共通定数 `memberHref(id)` で切り出すか | 1 行 `\`/members/${encodeURIComponent(id)}\`` のため共通化**しない** |
| `parseSearchParams` / `toApiQuery` のラウンドトリップ | 単一モジュールに集約 | OK。`lib/url/members-search.ts` に集約済み |
| Zod strict parse の散在 | `lib/api/public.ts` 内の 4 関数で同パターン | 関数内 1 行のため共通 helper 化**しない**。型推論を保つために strict 呼び出しは inline 維持 |
| `<h1>` / `<h2>` レベル管理 | 各 section 内で個別 | OK。`Hero` は `<h1>`、それ以外は `<h2>` で固定 |

## 抽象化判断（YAGNI 適用）

- フィルタ UI 各フィールドを field-component に抽出**しない**（`MemberFilters.client.tsx` 内 inline。再利用予定なし）
- `MemberCard` を density 別 3 component に分岐**しない**（props で切替で十分）
- API wrapper を generic な `withZod<T>(schema, url)` 化**しない**（4 endpoint しかなく、可読性を優先）

## 既存重複の整理

- 既存 `apps/web/src/components/public/StatCard.tsx` は `Stats.tsx` の内部で再利用する（重複新設しない）
- 既存 `apps/web/src/lib/fetch/public.ts` を残し、`lib/api/public.ts` は薄い wrapper として上に乗せる（既存テスト維持）

## 完了条件

- [ ] 重複検出 7 観点に対する判断が記録されている
- [ ] 過剰抽象化を行っていない（CONST_003 タスク特性最適化）
- [ ] 既存資産（`StatCard.tsx` / `lib/fetch/public.ts`）の再利用方針が記録されている
