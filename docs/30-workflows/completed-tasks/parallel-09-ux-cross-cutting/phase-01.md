# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/src/components/ui/` 配下に新規 primitive モジュール 4 件 (FormField/Pagination/Icon/Breadcrumb) を追加し、`useAdminMutation.ts` と `globals.css` `@layer components` の編集を伴うコード実装タスクの要件定義 Phase。仕様策定単独では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

parallel-09 (UX primitives 統一 G9-1〜G9-9) の必要性・スコープ・受入条件を確定し、Phase 2 の 9 設計成果物に渡す入力を本 Phase で固定する。特に以下 4 つの真の論点を本 Phase で明文化する:

1. **primitive 統一の必要性**: 19 routes に分散する form/pagination/breadcrumb/icon/empty state の挙動差異を共通 primitive で吸収する妥当性
2. **既存 EmptyState との衝突回避**: `apps/web/src/components/ui/EmptyState.tsx` 既存 API を破壊せず G9-2 拡張を達成する方法
3. **parallel-03 との `@layer components` 共存**: parallel-03 の CSS 規則と本 task G9-{1,6,7} の規則が同じ `@layer components` を編集する衝突の解消方針
4. **OKLch token 正本との整合**: 不足 token がある場合の対処（task-09 token への feedback or 既存 token の組み合わせで吸収）

## 真の論点

### 論点 1: primitive 統一の必要性

19 routes (公開 6 + 会員 2 + 管理 8 + 共通 3) の各画面が独自 form / pagination / breadcrumb / empty state を実装すると以下が発生する:

- a11y 違反の散発的混入 (`aria-invalid` 漏れ / breadcrumb の `nav[aria-label]` 欠落)
- HEX 直書き混入 (`border-[#ff0000]` 等) → `verify-design-tokens` gate 違反
- mutation 二重送信による D1 重複書込 (G9-8 で防止)
- error 時 form state 消失による UX 劣化 (G9-9 で防止)

選択肢:
- **(A) 共通 primitive を `apps/web/src/components/ui/` に集約**: import 1 行で AC を満たせる。**第一推奨**。
- **(B) 各 spec 内で個別実装**: 一貫性が崩れ、`verify-design-tokens` / a11y CI gate の違反が散発する。**不採用**。
- **(C) 外部 UI ライブラリ (shadcn/ui 等) を導入**: bundle 増大 + token 整合の追加実装が必要。MVP recovery のスコープ外。**不採用**。

→ Phase 1 では **(A) 共通 primitive 集約** を採用として確定する。

### 論点 2: 既存 EmptyState との衝突回避

`apps/web/src/components/ui/EmptyState.tsx` は既に存在し、19 routes の一部 (admin/audit, admin/identity-conflicts 等) で利用されている可能性がある。G9-2 仕様では `icon` / `title` / `description` / `action` の 4 props 構成に拡張する必要がある。

選択肢:
- **(A) props を全て optional にして後方互換維持**: 既存 caller (`<EmptyState>テキスト</EmptyState>` 形式) が壊れない。**第一推奨**。
- **(B) 新規 `EmptyStateV2.tsx` を作って旧版は deprecated 化**: ファイル増加 + マイグレーション計画が必要。MVP では過剰投資。**不採用**。
- **(C) breaking change として一括書き換え**: 既存 caller を全て本 task で改修する必要があり、本 task のスコープを超過する。**不採用**。

→ Phase 1 では **(A) optional props 拡張** を採用として確定する。Phase 02 で既存 caller の挙動互換を AC-2 として明示する。

### 論点 3: parallel-03 との `@layer components` 共存

parallel-03 (typography / spacing primitives) も `apps/web/src/styles/globals.css` の `@layer components` を編集対象としており、本 task G9-{1,6,7} と同じ layer を同時編集する。merge conflict が発生する可能性がある。

選択肢:
- **(A) section コメントで責務領域を明示分離**: `/* === parallel-09 G9-1 form validation === */` のような section コメントで規則を block 化し、parallel-03 と物理的に行範囲を分離する。**第一推奨**。
- **(B) 別 CSS ファイルに分離 (`globals-parallel-09.css`)**: import 順序の管理コストが発生 + Tailwind `@layer` 機能を分散させる。**不採用**。
- **(C) parallel-03 完了を待つ直列化**: 並列開発の利点を失う。**不採用**。

→ Phase 1 では **(A) section コメントで分離** を採用として確定する。Phase 03 設計レビュー観点 R-7 で merge conflict 想定を確認する。

### 論点 4: OKLch token 正本との整合

spec.md (parallel-09) では `--ubm-color-danger`, `--ubm-color-danger-soft`, `--ubm-color-text-primary`, `--ubm-color-text-secondary`, `--ubm-color-accent`, `--ubm-spacing-{sm,md,lg,xl}`, `--ubm-text-{xs,sm,lg}`, `--ubm-ease-standard` を参照する。これら全てが `apps/web/src/styles/tokens.css` (task-09) に既に定義されている保証が必要。

選択肢:
- **(A) Phase 01 で tokens.css を grep し全 token の存在を確認、不足分は Phase 02 で組み合わせ吸収**: 追加 token を作らない。**第一推奨**。
- **(B) 不足 token を本 task で追加**: task-09 (design-tokens) の責務領域に侵入する。不変条件 5 違反。**不採用**。
- **(C) 不足 token を task-09 への feedback として Phase 12 で記録**: 本サイクルで完結しない (CONST_007 違反)。**条件付き採用**: (A) で吸収不能な場合のみ補助的に使う。

→ Phase 1 では **(A) 既存 token のみで吸収** を採用として確定する。Phase 02 設計時に grep 結果を `outputs/phase-01/requirements.md` に転記する。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | task-08 (design-tokens spec) / task-09 (tokens.css 実装) | OKLch token は本 task で追加・変更しない。既存 token のみ参照 |
| 上流 | task-18 (`verify-design-tokens` CI gate) | HEX 直書き禁止規則を遵守 |
| 上流 | parallel-03 (typography / spacing primitive) | `@layer components` の section 分離で共存 |
| 連携 | parallel-01〜08 各 spec | 本 task の primitive を import して利用 (本 task では import 側の改修はしない) |
| 対象外 | apps/api 全配下 | API 変更禁止 |
| 対象外 | D1 schema | 不要 |
| 対象外 | Google Form schema | 不要 |
| 対象外 | 認証設計 (task-13 mvp-auth) | 不要 |

## 価値とコスト評価

- **初回提供価値**: 19 routes の UX 一貫性確保。a11y 違反の構造的防止。HEX 直書き混入の物理的不可能化。mutation 二重送信による D1 整合性破壊の防止。form error 時の入力消失防止。
- **初回に払わないコスト**: 外部 UI ライブラリ導入、新規 design token 追加、既存 EmptyState の breaking change、parallel-03 への直列化待ち。
- **設計コスト (Phase 02)**: 9 設計ドキュメント (`g9-{1..9}-*-design.md`) + Phase 03 レビュー 1 件 = 10 ドキュメント。
- **実装コスト見積 (Phase 4 以降・後続サイクル)**:
  - `FormField.tsx` 新規 約 60〜80 行
  - `Pagination.tsx` 新規 約 50 行
  - `Icon.tsx` 新規 約 40 行
  - `Breadcrumb.tsx` 新規 約 60 行
  - `EmptyState.tsx` 編集 約 +30 行 (拡張差分)
  - `useAdminMutation.ts` 編集 約 +40 行
  - `globals.css` 編集 約 +80 行 (G9-1/6/7 規則)
  - 各 primitive の `*.spec.tsx` (Vitest) 約 80〜120 行 × 5 = 400〜600 行
- **運用コスト**: primitive の継続的メンテ (a11y 規則 update, design token 変更追従)。

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | 19 routes 横断 UX 一貫性とアクセシビリティ違反 0 化を達成できるか | PASS | — |
| 実現性 | 既存 React + Tailwind + tokens.css 構成内で 9 primitive を実装可能か | PASS | 論点 1 (A) 共通 primitive 採用で達成 |
| 整合性 | 既存 EmptyState API / parallel-03 `@layer components` / tokens.css 正本と整合するか | CONDITIONAL | 論点 2 (A) optional props / 論点 3 (A) section 分離 / 論点 4 (A) 既存 token のみ参照 を Phase 02 で具体化 |
| 運用性 | concurrent mutation guard が user の正当な再送信を阻害しないか / form state preserve が意図的 reset を妨げないか | CONDITIONAL | G9-8 は同一 hook instance 内 ongoing mutation 中のみ 2nd call 拒否、G9-9 は user action 経由の reset を許可する設計を Phase 02 で固定 |

## 既存資産インベントリ (Phase 02 設計時に grep で確認)

| 資産 | 確認観点 | 確認方法 |
| --- | --- | --- |
| `apps/web/src/styles/tokens.css` | OKLch token (`--ubm-color-danger` / `--ubm-color-danger-soft` / `--ubm-color-text-primary` / `--ubm-color-text-secondary` / `--ubm-color-accent` / `--ubm-spacing-{sm,md,lg,xl}` / `--ubm-text-{xs,sm,lg}` / `--ubm-ease-standard`) の全件存在 | `grep -E '^\s*--ubm-(color|spacing|text|ease)-' apps/web/src/styles/tokens.css` |
| `apps/web/src/styles/globals.css` | 既存 `@layer components` 規則の行範囲 / `:focus-visible` の既存定義有無 | `grep -n '@layer\|:focus-visible' apps/web/src/styles/globals.css` |
| `apps/web/src/components/ui/EmptyState.tsx` | 既存 props / 既存 caller 挙動 | `cat apps/web/src/components/ui/EmptyState.tsx` および `grep -rn 'from .*EmptyState' apps/web/src` |
| `apps/web/src/components/ui/icons.ts`（または相当ファイル） | 既存 `IconName` 型・既存 icon 実装の有無 | `find apps/web/src -name 'icon*' -o -name 'Icon*'` |
| `apps/web/src/lib/useAdminMutation.ts` | 既存シグネチャ / 既存 caller 数 | `cat apps/web/src/lib/useAdminMutation.ts` および `grep -rn 'useAdminMutation' apps/web/src` |
| `apps/web/src/components/admin/` | 既存 Breadcrumb 相当の primitive 有無 | `find apps/web/src/components/admin -type f -name '*.tsx'` |
| `apps/web/src/components/ui/Pagination*.tsx` | 既存 Pagination 実装の有無 | `find apps/web/src -iname 'pagination*'` |
| `verify-design-tokens` CI gate (task-18) | HEX 直書き検出ロジック | `cat .github/workflows/verify-design-tokens.yml`（存在する場合） |

> 上記 grep 結果は Phase 02 着手前に必ず記録し、`outputs/phase-01/requirements.md` の「既存資産インベントリ」セクションに転記する。

## スコープ確定

### 含む

- `apps/web/src/components/ui/FormField.tsx` 新規 (G9-1)
- `apps/web/src/components/ui/Pagination.tsx` 新規 (G9-3)
- `apps/web/src/components/ui/Icon.tsx` 新規 (G9-4)
- `apps/web/src/components/admin/Breadcrumb.tsx` 新規 (G9-5)
- `apps/web/src/components/ui/EmptyState.tsx` 編集 (G9-2 後方互換拡張)
- `apps/web/src/lib/useAdminMutation.ts` 編集 (G9-8/9)
- `apps/web/src/styles/globals.css` 編集 (G9-1/6/7 `@layer components` 追記)
- 各 primitive の Vitest unit test (`*.spec.tsx`)
- a11y test (jest-axe) によるアクセシビリティ違反 0 確認
- Playwright visual smoke での見た目確認

### 含まない

- 19 routes 各画面への primitive 適用 (parallel-01〜08 の責務)
- 新規 OKLch token 追加 (task-09 の責務)
- API endpoint 追加・変更 (apps/api 全配下不変)
- D1 schema 変更
- Google Form schema 変更
- 外部 UI ライブラリ (shadcn/ui 等) 導入
- state management ライブラリ (Zustand, Jotai 等) 導入

## 受入条件 (AC) 確認

index.md で定義した AC-1〜AC-10 を Phase 1 で正式承認する。
- AC-1〜AC-9 → Phase 2 各 g9-* design ドキュメントに対応
- AC-10 → Phase 3 design-review.md に対応

## 用語集

| 用語 | 意味 |
| --- | --- |
| primitive | UI を構成する最小単位コンポーネント。19 routes 横断で再利用される (FormField, Pagination, Breadcrumb 等) |
| OKLch token | `apps/web/src/styles/tokens.css` で定義される CSS カスタムプロパティ。色は OKLch 色空間で表現 |
| `@layer components` | Tailwind の CSS layer 機能。`@layer base / components / utilities` の中で components 層を本 task で編集 |
| concurrent mutation guard | mutation 関数が ongoing 中に 2nd call を拒否する hook level guard。D1 二重書込防止が目的 |
| form state preserve | mutation 失敗時に form input.value をリセットせず保持し、user の入力作業を保護する hook 仕様 |
| section 分離 | `globals.css` の `@layer components` 内に `/* === parallel-09 G9-1 === */` のようなコメント付き block で規則を物理的に分離する手法 |
| `aria-current="page"` | Breadcrumb の最終項目 (現在ページ) に付与する WAI-ARIA 属性。スクリーンリーダーで現在位置を読み上げる |
| dayOfWeek 判定 | 本 task では未使用 (UT-17-FU-003 用語との混同回避のため記載) |

## 実行タスク

- [ ] 原典 spec `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` を読み込み、G9-1〜G9-9 の設計案を本 Phase 要件に転記する
- [ ] 既存資産インベントリの grep を全件実行し、結果を `outputs/phase-01/requirements.md` に記録する
- [ ] 真の論点 4 点を Phase 1 で明文化する
- [ ] 4 条件評価を行い、CONDITIONAL の解消条件 2 件を Phase 2 申し送り事項に明記する
- [ ] AC-1〜AC-10 を Phase 1 で正式承認する
- [ ] `outputs/phase-01/requirements.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md | 原典タスク仕様 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 19 routes 範囲・正本順位 |
| 必須 | docs/00-getting-started-manual/specs/design-tokens.md | OKLch token 正本 |
| 必須 | apps/web/src/styles/tokens.css | 実装側 token 正本 |
| 必須 | apps/web/src/styles/globals.css | `@layer components` 編集対象 |
| 必須 | apps/web/src/components/ui/EmptyState.tsx | G9-2 拡張対象 |
| 必須 | CLAUDE.md | 「UI prototype alignment / MVP recovery」セクション |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-* | `@layer components` 同時編集の競合範囲 |
| 参考 | https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ | Breadcrumb ARIA pattern |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物 (4 論点・スコープ・AC・4 条件評価・既存資産インベントリ・用語集) |

## 完了条件

- [ ] 4 つの真の論点が文書化されている
- [ ] 4 条件評価が PASS / CONDITIONAL で記録され、CONDITIONAL 2 件 (整合性・運用性) の解消条件が明示されている
- [ ] AC-1〜AC-10 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリの grep 結果が記録されている
- [ ] downstream handoff (Phase 2 への引き継ぎ事項) が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系 (既存 EmptyState caller 破壊 / parallel-03 merge conflict / OKLch token 不足 / mutation guard 過剰拒否 / form state preserve が意図的 reset 阻害) を Phase 2 申し送り事項に含む
- 次 Phase への引き継ぎ事項を明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点 1〜4 の採用案 ((A)-(A)-(A)-(A)) を Phase 2 設計の前提として固定
  - CONDITIONAL 解消条件 2 件 (整合性 3 項目 / 運用性 2 項目) を Phase 2 で具体化
  - 既存資産インベントリの grep 結果を Phase 2 設計内のコード参照に転記
  - G9-1〜G9-9 の 9 設計を `outputs/phase-02/g9-{1..9}-*-design.md` として個別ファイルに展開
- ブロック条件: `outputs/phase-01/requirements.md` 未作成 / CONDITIONAL 解消条件未記録 の場合は Phase 2 に進まない
