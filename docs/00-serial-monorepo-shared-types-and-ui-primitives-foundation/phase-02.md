# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 2 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 1 (要件定義) |
| 下流 Phase | 3 (設計レビュー) |
| 状態 | completed |

## 目的

Phase 1 の真の論点を満たす monorepo / package / UI primitives / 型 4 層の構造設計を Mermaid と表で固定する。後続 Wave が参照する「ファイル配置」「export 表面」「dependency matrix」「env 境界」を確定する。

## 実行タスク

1. monorepo ディレクトリ構造を Mermaid で図示
2. pnpm workspace の package 一覧と相互依存（dependency matrix）を確定
3. UI primitives 15 種の API 仕様を 16-component-library.md と突合
4. 型 4 層（schema / response / identity / viewmodel）の export 表面を `packages/shared/src/index.ts` の placeholder で確定
5. ESLint rule（`apps/web` → D1 import 禁止）の rule 定義を placeholder 化
6. 環境変数一覧を確定（このタスクでは secrets ゼロを明示）
7. tones.ts の `zoneTone` / `statusTone` の signature と return 値マッピング表を確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives 仕様 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 0 設計、env 一覧 |
| 必須 | CLAUDE.md | スタック、フォーム固定値 |
| 参考 | doc/00-getting-started-manual/specs/00-overview.md | 3 層構成 |

## 実行手順

### ステップ 1: Mermaid 構造図の作成
- monorepo ルートからの依存方向を明示（apps → packages の単方向）

### ステップ 2: dependency matrix の作成
- 横軸: 依存元、縦軸: 依存先

### ステップ 3: UI primitives 仕様の突合
- 15 種すべての props を 16-component-library.md と一致確認、追加 / 削除なし

### ステップ 4: 型 4 層の placeholder 設計
- 各層が import すべき外部型（zod は 01b で）

### ステップ 5: ESLint rule の placeholder 文面化

### ステップ 6: outputs/phase-02 への成果物配置

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビューで alternative 案と比較 |
| Phase 5 | runbook に scaffold 順序として渡す |
| Phase 7 | AC マトリクスで設計と検証を一対一対応 |

## 多角的チェック観点（不変条件参照）

- **#1（schema 固定回避）**: 型 4 層分離設計、`stableKey` 直書きを 06a/b/c で禁止する素地
- **#5（apps/web → D1 禁止）**: ESLint rule の AST パターン定義（`@cloudflare/d1` import / `D1Database` 型 import を error）
- **#6（GAS prototype 非昇格）**: UI primitives で `localStorage` を呼び出さない設計（Avatar の `hue` 算出をクライアント計算に閉じる）
- **#8（localStorage 非正本）**: Toast / Avatar の状態を React state のみで管理する設計
- **無料枠（#10）**: 設計段階では未触

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Mermaid 図 | 2 | completed | outputs/phase-02/main.md |
| 2 | dependency matrix | 2 | completed | outputs/phase-02/main.md |
| 3 | UI primitives 仕様突合 | 2 | completed | 15 種 |
| 4 | 型 4 層 placeholder | 2 | completed | packages/shared/src/index.ts 案 |
| 5 | ESLint rule placeholder | 2 | completed | no-restricted-imports |
| 6 | env 一覧 | 2 | completed | このタスクでは 0 件 |
| 7 | tones.ts signature | 2 | completed | mapping 表 |
| 8 | monorepo-layout.md 作成 | 2 | completed | outputs/phase-02/monorepo-layout.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 設計総合（図、matrix、API 表、env） |
| ドキュメント | outputs/phase-02/monorepo-layout.md | pnpm workspace ディレクトリツリー |
| メタ | artifacts.json | Phase 2 を completed に更新 |

## 完了条件

- [ ] Mermaid 構造図が apps / packages の依存方向を一意に表現
- [ ] dependency matrix が 4 package（apps/web, apps/api, packages/shared, packages/integrations/google）を網羅
- [ ] UI primitives 15 種すべて props 表と barrel export 案が確定
- [ ] 型 4 層 placeholder が `MemberId` / `ResponseId` / `ResponseEmail` / `StableKey` を含む
- [ ] ESLint rule placeholder の AST パターン文面が確定

## タスク 100% 実行確認【必須】

- [ ] 全 8 サブタスクが completed
- [ ] outputs/phase-02/main.md と monorepo-layout.md が配置済み
- [ ] env 一覧表（このタスクは 0 件）が記載
- [ ] artifacts.json の phase 2 を completed に更新

## 次 Phase

- 次: Phase 3（設計レビュー）
- 引き継ぎ事項: alternative 案の比較対象（単一 package vs 4 package、UI primitives を別 package 化 vs apps/web 内）
- ブロック条件: outputs/phase-02/main.md が未作成

## 構成図 (Mermaid)

```mermaid
graph TD
  Root[pnpm workspace root]
  Root --> AppsWeb[apps/web<br/>Next.js + @opennextjs/cloudflare]
  Root --> AppsApi[apps/api<br/>Hono + Workers]
  Root --> PkgShared[packages/shared<br/>types + zod schema 雛形]
  Root --> PkgIntg[packages/integrations/google<br/>Forms client 雛形]
  AppsWeb -->|import| PkgShared
  AppsApi -->|import| PkgShared
  AppsApi -->|import| PkgIntg
  AppsWeb -.X.->|禁止 (#5)| AppsApi
  AppsWeb -.X.->|禁止 (#5)| D1[(D1 binding)]
  AppsApi -->|許可| D1
  PkgIntg -->|外部 API| GForms[Google Forms API]
```

## 環境変数一覧

| 区分 | 代表値 | 置き場所 | 担当 Phase |
| --- | --- | --- | --- |
| なし | - | - | - |

このタスクは scaffold のみで env / secret を一切扱わない。後続 Wave で順次導入。

## 依存マトリクス（package 単位）

| 依存元 ↓ \ 依存先 → | apps/web | apps/api | packages/shared | packages/integrations/google |
| --- | :---: | :---: | :---: | :---: |
| apps/web | - | NG (#5) | OK | NG（直接呼び出し禁止） |
| apps/api | NG | - | OK | OK |
| packages/shared | NG | NG | - | NG |
| packages/integrations/google | NG | NG | OK | - |

## モジュール設計（このタスクで生成する file）

### apps/web
- `apps/web/src/app/layout.tsx`（root layout 雛形）
- `apps/web/src/app/(public)/page.tsx`（landing 雛形 = 空）
- `apps/web/src/app/(member)/layout.tsx`
- `apps/web/src/app/(admin)/layout.tsx`
- `apps/web/src/components/ui/{Chip,Avatar,Button,Switch,Segmented,Field,Input,Textarea,Select,Search,Drawer,Modal,Toast,KVList,LinkPills}.tsx`
- `apps/web/src/components/ui/index.ts`（barrel export）
- `apps/web/src/components/ui/icons.ts`（IconName 列挙）
- `apps/web/src/lib/tones.ts`（zoneTone / statusTone）
- `apps/web/next.config.js`（@opennextjs/cloudflare 設定）
- `apps/web/wrangler.toml`（Pages 設定 placeholder）
- `apps/web/package.json`

### apps/api
- `apps/api/src/index.ts`（Hono entry、`GET /healthz` のみ）
- `apps/api/wrangler.toml`（Workers 設定）
- `apps/api/package.json`

### packages/shared
- `packages/shared/src/index.ts`（barrel）
- `packages/shared/src/types/ids.ts`（branded type: MemberId / ResponseId / ResponseEmail / StableKey）
- `packages/shared/src/types/{schema,response,identity,viewmodel}/index.ts`（4 層スケルトン、実装は 01b）
- `packages/shared/package.json`

### packages/integrations/google
- `packages/integrations/google/src/index.ts`（barrel、interface のみ）
- `packages/integrations/google/src/forms-client.ts`（interface 雛形、実装は 01b）
- `packages/integrations/google/package.json`

### root
- `pnpm-workspace.yaml`
- `package.json`（typecheck / lint / test / dev script）
- `tsconfig.base.json`
- `.eslintrc.cjs`（no-restricted-imports rule placeholder）
- `vitest.config.ts`

## tones.ts signature と mapping

```ts
export type ChipTone = "stone" | "warm" | "cool" | "green" | "amber" | "red";
export function zoneTone(zone: string): ChipTone;
export function statusTone(status: string): ChipTone;
```

| zone | tone |
| --- | --- |
| `0_to_1` | `cool` |
| `1_to_10` | `warm` |
| `10_to_100` | `amber` |
| その他 | `stone` |

| status (`ubmMembershipType`) | tone |
| --- | --- |
| `member` | `green` |
| `non_member` | `stone` |
| `academy` | `cool` |
| その他 | `stone` |
