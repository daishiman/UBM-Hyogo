# Phase 10: 後付けリファクタ（最小スコープ）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 9 で受入が GO となった primitive / hook / CSS を対象に、**実コードのリファクタ（重複の整理 + parallel-03 と共有する globals.css の section comment 整理）** を行う Phase。コード変更を伴うため実装仕様書として残す。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 後付けリファクタ（最小スコープ） |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (VISUAL evidence) |
| 状態 | pending |

---

## 目的

Phase 9 で AC 全件 PASS した primitive / hook / CSS を対象に、**最小スコープのリファクタ**のみ実施する。本タスクは小規模であり、過剰リファクタを避けるため以下を方針とする:

- 公開 API（4 primitive の Props / `useAdminMutation` の戻り値型）を変更しない
- 既存 caller (EmptyState 5 箇所) の挙動を変更しない
- `apps/web/src/lib/` への新規ファイル切り出しは行わない（YAGNI）
- リファクタは **(1) primitive 内 helper の重複整理** と **(2) globals.css の section comment 整理（parallel-03 共存設計）** に限る

---

## 10-1. リファクタ判定マトリクス

| 観点 | 判定基準 | 該当時の対応 |
| --- | --- | --- |
| primitive 1 ファイルの行数 | 120 行超 | private helper を同ファイル内 module-local 関数に抽出 |
| primitive 内 cyclomatic | 8 超 | 同上 |
| `aria-invalid` / `aria-describedby` 注入ロジック | 2 primitive 以上で重複 | 共通 helper に集約（同ファイル内）。再利用候補が他になければ抽出しない |
| globals.css `@layer components` 内の section コメント | parallel-03 (G3-*) と物理位置が混在 | section コメントを `/* === parallel-09 G9-x === */` 形式で明示分離 |
| `useAdminMutation` の guard ロジック | toast 呼び出しが複数箇所 | toast 呼び出しを 1 関数に集約 |
| Icon `sizeMap` のハードコード | sm/md/lg/xl 4 size を 2 箇所以上で参照 | `const SIZE_PX = { sm: 12, md: 16, lg: 20, xl: 24 } as const` を Icon.tsx 内 module-local に集約 |

> **結論方針**: 抽出は各 primitive ファイル内 **private**（同ファイル内 module-local 関数）にとどめる。`apps/web/src/lib/` への新規ファイル追加は、再利用候補が他に出てくるまで **行わない**（過剰抽象化の回避）。

---

## 10-2. 抽出候補と判定

### 候補 A: globals.css の section comment 整理（parallel-03 共存設計）

| 項目 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/styles/globals.css` |
| 理由 | parallel-03 (G3-*) と本 task (G9-*) が同じ `@layer components` を編集する。section コメントで物理位置を明示分離し、merge conflict 発生時の解消コストを下げる |
| 整理方針 | `@layer components { /* === parallel-03 G3-* === */ ... /* === parallel-09 G9-1 form validation === */ ... /* === parallel-09 G9-6 responsive === */ ... /* === parallel-09 G9-7 focus-visible === */ ... }` のように section ブロックで囲み、parallel-03 セクションの末尾と本 task セクションの先頭の間に空行 + コメント区切り |
| diff 範囲 | section コメントの追加 / 移動のみ。CSS 規則自体は変更しない |
| 検証 | Phase 9 の visual snapshot と diff 0 |

### 候補 B: Icon.tsx 内 sizeMap の module-local 定数化

| 項目 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/components/ui/Icon.tsx` |
| 理由 | `sizeMap` を関数内ローカルから module-local `const SIZE_PX` に格上げし、type 安全性を高める |
| シグネチャ変更 | なし（`IconSize` / `IconProps` は不変） |
| 実装 | `const SIZE_PX: Record<IconSize, number> = { sm: 12, md: 16, lg: 20, xl: 24 } as const;` |
| テスト | Phase 7 unit が PASS のまま |

### 候補 C: FormField.tsx 内 `errorId` 生成 helper の局所化

| 項目 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/components/ui/FormField.tsx` |
| 理由 | `${name}-error` の 1 行は inline で十分。helper 化しない |
| 判定 | **抽出しない**（YAGNI） |

### 候補 D: useAdminMutation の toast 呼び出し集約

| 項目 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/lib/useAdminMutation.ts` |
| 理由 | `toast({ type: "warn", ... })` と `toast({ type: "error", ... })` が 2 箇所。helper 化により行数が逆に増えるため inline 維持 |
| 判定 | **抽出しない** |

### 候補 E: `apps/web/src/lib/` への新規ファイル切り出し

| 項目 | 内容 |
| --- | --- |
| 判定 | **実施しない** |
| 根拠 | 現時点で本 task 以外の caller が存在しない。Premature abstraction を避け、再利用需要が出た時点で別 task で切り出す |
| 将来移動条件 | parallel-01〜08 のいずれかで `verifyAriaInvalid` 等の汎用 helper 需要が出た場合、`apps/web/src/lib/aria-helpers.ts` を新規作成する followup を起票 |

---

## 10-3. globals.css 整理の詳細手順

### 現状（リファクタ前）

`apps/web/src/styles/globals.css` の `@layer components` 内に G3-* と G9-* が混在している可能性がある。

### リファクタ後の section 構造

```css
@layer components {
  /* === parallel-03 G3-* (motion / a11y / scroll) === */
  /* parallel-03 専用ルールはここに集約 */
  ...

  /* === parallel-09 G9-1 form validation === */
  [data-component="form-field"] { ... }
  [data-component="form-field"] label { ... }
  input[aria-invalid="true"],
  textarea[aria-invalid="true"],
  select[aria-invalid="true"] { ... }
  [data-component="form-error"] { ... }

  /* === parallel-09 G9-6 mobile responsive contract === */
  /* breakpoint 規則（component-level） */
  ...

  /* === parallel-09 G9-7 focus-visible / motion-reduce === */
  :focus-visible { ... }
  @media (prefers-reduced-motion: reduce) { ... }
}
```

### 検証

```bash
# section コメントが 4 つ以上存在
grep -cE "/\* === parallel-(03|09) G[0-9]-" apps/web/src/styles/globals.css
# 期待: 4 以上

# Phase 9 の visual snapshot と差分 0
mise exec -- pnpm --filter @ubm-hyogo/web test:visual
```

---

## 10-4. 変更対象ファイル一覧

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/src/styles/globals.css` | `@layer components` 内の section コメント追加 + 物理位置の整理（CSS 規則自体は変更しない） |
| `apps/web/src/components/ui/Icon.tsx` | `sizeMap` を module-local `SIZE_PX` 定数に格上げ（公開 API 不変） |
| `apps/web/src/components/ui/FormField.tsx` | **変更なし**（候補 C 不採用） |
| `apps/web/src/components/ui/Pagination.tsx` | **変更なし** |
| `apps/web/src/components/admin/Breadcrumb.tsx` | **変更なし** |
| `apps/web/src/lib/useAdminMutation.ts` | **変更なし**（候補 D 不採用） |
| 各 spec ファイル | **変更なし**（公開 API が不変のため） |

---

## 10-5. 主要関数シグネチャ（リファクタ後）

```ts
// apps/web/src/components/ui/Icon.tsx (リファクタ後)

export type IconSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<IconSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  size: IconSize;
  name: IconName;
}

export function Icon({ size, name, ...props }: IconProps): JSX.Element;
```

> 公開 API (`IconSize` / `IconProps` / `Icon`) は完全に不変。

---

## 10-6. 入出力・副作用

| 関数 / モジュール | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `Icon` | `IconProps` | `JSX.Element` | なし（pure render） |
| `globals.css @layer components` | なし | CSS layer | なし（visual only。snapshot 不変） |

---

## 10-7. テスト方針 / 検証コマンド

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| 静的 | `mise exec -- pnpm typecheck` | PASS |
| 静的 | `mise exec -- pnpm lint` | PASS |
| ユニット | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 既存 6 spec が全 PASS（リファクタは振る舞いを変えない） |
| visual | `mise exec -- pnpm --filter @ubm-hyogo/web test:visual` | snapshot diff 0（Phase 9 baseline と一致） |
| section comment | `grep -cE "/\* === parallel-(03\|09) G[0-9]-" apps/web/src/styles/globals.css` | 4 以上 |
| 既存 caller 不変 | `grep -rn "from.*ui/Icon" apps/web/src --include="*.tsx" --include="*.ts" \| grep -v __tests__` | Phase 6 の caller 一覧と同数 |

---

## 10-8. リグレッション防止

| リスク | 対策 |
| --- | --- |
| section コメント整理時に CSS 規則を誤って削除 | `git diff dev -- apps/web/src/styles/globals.css` で **コメント追加 / セレクタ移動以外の diff 0** を確認 |
| `SIZE_PX` 定数化で typecheck が壊れる | `Record<IconSize, number>` で型を明示し、`as const` で literal type を保持 |
| Phase 9 の visual snapshot が変わる | 10-7 visual テスト diff 0 で gate |
| 公開 API の意図せぬ変更 | `git diff dev -- apps/web/src/components/ui/Icon.tsx` で `export` 行に変更がないことを確認 |

---

## 10-9. DoD

- [ ] Icon.tsx の `SIZE_PX` 定数化が完了し公開 API 不変
- [ ] globals.css に `/* === parallel-09 G9-* === */` section コメントが 3 セクション以上存在
- [ ] parallel-03 セクションと物理位置で分離されている
- [ ] vitest 全 PASS（既存テスト修正なし）
- [ ] visual snapshot diff 0（Phase 9 baseline と一致）
- [ ] `outputs/phase-10/refactor-summary.md` に before/after / 抽出関数一覧 / 不採用候補（C/D/E）の根拠が記録

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | AC 突合表 PASS 値を「振る舞い不変」ベースラインに固定 | リファクタ後に同 AC が PASS のままであることを確認 |
| Phase 11 | リファクタ後の primitive を visual evidence として再取得 | Phase 11 で 6 種 visual snapshot を取得 |
| parallel-03 | `@layer components` 同時編集 | section comment 分離により merge conflict 予防 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/phase-09.md` | 受入結果 |
| 必須 | `apps/web/src/styles/globals.css` | section comment 整理対象 |
| 必須 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md`「10. リスク・制約」 | parallel-03 共存方針 |
| 参考 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-10.md` | リファクタ判定マトリクスのフォーマット |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-10/refactor-summary.md` | before/after 行数 + 抽出関数一覧 + 不採用候補の根拠 |
| evidence | `outputs/phase-10/globals-css-diff.txt` | `git diff dev -- apps/web/src/styles/globals.css` の出力 |
| メタ | `artifacts.json` | phase-10 を completed に更新 |

---

## 完了条件

- [ ] 10-9 DoD 全項目が [x]
- [ ] 公開 API (4 primitive Props / `useAdminMutation` 戻り値) に変更がない
- [ ] `apps/web/src/lib/` への新規ファイル追加がない
- [ ] visual snapshot diff 0
- [ ] outputs/phase-10/ に 2 evidence ファイル存在

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（VISUAL evidence）
- 引き継ぎ事項:
  - リファクタ後の 4 primitive を Phase 11 で 6 種類の scaled visual evidence として撮影
  - globals.css の section comment 整理結果を Phase 13 PR 本文「設計判断」に転記
  - 不採用候補 C/D/E の根拠を Phase 12 system-spec-update-summary に「YAGNI 適用例」として転記
- ブロック条件: 公開 API が変更された / `apps/web/src/lib/` に新規ファイルが追加された / visual snapshot に diff が出た のいずれかが発生した場合は実行しない
