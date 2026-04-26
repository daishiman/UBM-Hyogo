# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 8 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 7 (AC マトリクス) |
| 下流 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

命名・型・path・endpoint・module 名の重複を Before/After で整理し、後続 Wave が import 経路で迷わないようにする。Wave 0 の段階で命名規約を固めることで、22 並列タスクの merge conflict を予防する。

## 実行タスク

1. package alias の Before/After（`@ubm/shared` 等の確定）
2. UI primitives 命名 Before/After（16-component-library.md と一致確認）
3. 型 alias Before/After（branded type 命名）
4. path Before/After（`apps/web/src/components/ui/` か `apps/web/components/ui/` か）
5. ESLint rule 名 Before/After（`no-d1-from-web` 等）
6. outputs/phase-08/main.md 作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計案 |
| 必須 | outputs/phase-05/runbook.md | placeholder |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | primitive 命名 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型命名 |

## 実行手順

### ステップ 1: package alias 確定
### ステップ 2: UI primitives 命名突合
### ステップ 3: 型 alias 確定
### ステップ 4: path 規約確定
### ステップ 5: ESLint rule 命名
### ステップ 6: Before/After 表化

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | typecheck / lint で実体一致確認 |
| Phase 12 | implementation-guide.md に転記 |

## 多角的チェック観点（不変条件参照）

- **#1**: 型 alias 命名で `stableKey` を `string` のまま晒さず branded 化
- **#5**: ESLint rule 命名が後続 Wave でも共有可能
- **#6**: primitive 命名が prototype 由来の悪名（`detailLayout` 等）を持ち込まない
- **#8**: 命名で localStorage 関連を排除

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | package alias | 8 | pending | 4 件 |
| 2 | UI primitives 命名 | 8 | pending | 15 件 |
| 3 | 型 alias | 8 | pending | 4 件 |
| 4 | path 規約 | 8 | pending | apps/web/src 配置 |
| 5 | ESLint rule 命名 | 8 | pending | 2 件 |
| 6 | outputs 作成 | 8 | pending | outputs/phase-08/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After 一覧 |
| メタ | artifacts.json | Phase 8 を completed |

## 完了条件

- [ ] 4 種（package / primitives / 型 / path）すべて Before/After 表完成
- [ ] 16-component-library.md / 04-types.md と完全一致
- [ ] 後続 Wave 1〜9 で参照可能な命名表が確定

## タスク 100% 実行確認【必須】

- [ ] 全 6 サブタスク completed
- [ ] outputs/phase-08/main.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 9（品質保証）
- 引き継ぎ事項: 命名表 → 後続 Wave の import 経路規約
- ブロック条件: 命名衝突が残っている

## Before / After

### Package alias

| Before（候補） | After（採用） | 理由 |
| --- | --- | --- |
| `@app/shared` | `@ubm/shared` | プロジェクト名 prefix で明示 |
| `@app/api` | `@ubm/api` | 同上 |
| `@app/web` | `@ubm/web` | 同上 |
| `@app/integrations-google` | `@ubm/integrations-google` | 同上 |

### UI primitives 命名（16-component-library.md 完全準拠）

| Before（NG 候補） | After（採用） |
| --- | --- |
| `Tag` | `Chip` |
| `Pill` | `Chip` |
| `IconButton` | `Button`（icon prop で表現） |
| `ConfirmModal` | `Modal`（content で表現） |
| `Toggle` | `Switch` |
| `RadioGroup` | `Segmented` |
| `Tabs` | `Segmented`（density 等） |
| `Notice` | `Toast` |
| `KVTable` | `KVList` |
| `SocialLinks` | `LinkPills` |

採用 15 種: Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills

### 型 alias（branded type）

| Before | After | 理由 |
| --- | --- | --- |
| `string`（メンバーID） | `MemberId` | 不変条件 #7 (responseId と混同防止) |
| `string`（回答ID） | `ResponseId` | 同上 |
| `string`（メール） | `ResponseEmail` | system field 識別 |
| `string`（フィールド ID） | `StableKey` | questionId 直書き禁止 |

### Path 規約

| Before（NG） | After（採用） |
| --- | --- |
| `apps/web/components/` | `apps/web/src/components/` |
| `apps/web/lib/` | `apps/web/src/lib/` |
| `apps/web/app/` | `apps/web/src/app/` |
| `apps/api/index.ts` | `apps/api/src/index.ts` |

### ESLint rule 命名

| Before | After | 担当ファイル |
| --- | --- | --- |
| `forbid-d1` | `no-d1-from-web` | `.eslintrc/rules/no-d1-from-web.ts` |
| `no-localstorage` | `no-localstorage-in-primitives` | `.eslintrc/rules/no-localstorage-in-primitives.ts` |

### Endpoint（Wave 0 では 1 件のみ）

| Before | After |
| --- | --- |
| `GET /health` | `GET /healthz`（k8s/Cloudflare 慣習に合わせる） |
