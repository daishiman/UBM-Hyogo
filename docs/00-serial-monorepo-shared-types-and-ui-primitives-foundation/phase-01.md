# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 1 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | なし |
| 下流 Phase | 2 (設計) |
| 状態 | completed |

## 目的

このタスクの真の論点（true issue）と依存境界、4 条件（価値性 / 実現性 / 整合性 / 運用性）を確定し、scope と AC を不変条件 #1〜#15 と整合させる。後続 Wave 1〜9 が前提とする「monorepo / 型 / UI primitives / lint 防御」を Phase 2 で設計する根拠を Phase 1 で固定する。

## 真の論点（true issue）

- **issue 1**: app 層で 24 タスクを並列実行可能にするには、最初に「触れていい場所」「触ってはいけない場所」を物理境界（ディレクトリ + lint rule）で固定する必要がある
- **issue 2**: 型 4 層（schema / response / identity / viewmodel）を 01b で実装する前に、`packages/shared` の export 表面（型 alias と placeholder）が決まっていなければ 02a/b/c が repository を書けない
- **issue 3**: UI primitives 15 種は 06a/b/c の 3 タスクが同時参照するので、命名・props 仕様・barrel export が Wave 0 で決まっていないと Wave 6 が並列化できない
- **issue 4**: `apps/web` から D1 へ直接アクセスする回路を Wave 0 で塞がないと、Wave 4〜6 で漏れが発生し不変条件 #5 を破る

## 依存境界

- **runtime 境界**: `apps/web`（Workers + Next.js）と `apps/api`（Workers + Hono）を別 build target にする
- **package 境界**: `packages/shared`（型 + zod schema）／`packages/integrations/google`（Forms client）の 2 package を独立化（apps からは relative import 不可、workspace alias 経由のみ）
- **layer 境界**: UI primitives は `apps/web/src/components/ui/` のみに置き、layout / member / admin の各 layer は別ディレクトリ（このタスクでは作らず後続）
- **D1 境界**: `apps/web` の `package.json` に `@cloudflare/d1` 依存を入れない、ESLint rule で import を禁止する placeholder

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | 後続 22 並列タスクが「土台」のせいで衝突しない、スキャフォールド完了で Wave 1 を即時開始できる |
| 払うコスト | UI primitives 15 種を一度に整備する初期投資（後で部分着手すると 06a/b/c で衝突する） |
| 払わないコスト | ビジネスロジック / D1 / 認証 / API 実装（各 Wave に分離済み） |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 後続全 Wave をブロック解除できるか | PASS | scaffold 完了で Wave 1a/1b が同時着手可能 |
| 実現性 | 無料運用枠内で完結するか | PASS | scaffold は Cloudflare resource を消費しない |
| 整合性 | branch / env / runtime / data / secret が矛盾しないか | PASS | このタスクは secrets を扱わず、apps/api ↔ D1 と apps/web ↔ apps/api の境界を ESLint rule で固定 |
| 運用性 | rollback / handoff / same-wave sync が成立するか | PASS | scaffold は git revert で完全 rollback 可能、Phase 12 で implementation-guide を残す |

## 実行タスク

1. 不変条件 #1, #5, #6, #8 を Phase 1 成果物に明文化する
2. 後続 Wave 1〜9 が「Wave 0 完了」をどう確認するか（AC-1〜AC-9）を確定する
3. UI primitives 15 種の名前と props（16-component-library.md）を確認し、雛形ファイル名一覧を確定する
4. 型 4 層の export 表面（`MemberId` / `ResponseId` / `ResponseEmail` / `StableKey` の placeholder 型）を確定する
5. apps/web から D1 直接 import を禁止する ESLint rule の placeholder を確定する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 3 層構成と不変条件 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層境界 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives 15 種仕様 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 境界（`apps/api` のみ） |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 0 設計、Wave マトリクス |
| 必須 | CLAUDE.md | 不変条件 #1〜#7、フォーム固定値、スタック |
| 参考 | doc/00-getting-started-manual/specs/05-pages.md | route group 構成 |

## 実行手順

### ステップ 1: scope の固定
- 「含む」「含まない」を index.md と一致させて確認
- ビジネスロジック・ページ実装は「含まない」とする

### ステップ 2: 4 条件と AC の整合
- 4 条件と AC-1〜AC-9 が PASS 判定で一致することを確認
- AC は quantitative（exit 0 / 15 種 export 等）であることを確認

### ステップ 3: outputs/phase-01/main.md 生成
- 真の論点、依存境界、価値とコスト、4 条件、不変条件マッピングを 1 ファイルに集約

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点 → module 設計の入力 |
| Phase 4 | AC → verify suite の入力 |
| Phase 7 | AC matrix のトレース元 |
| Phase 10 | GO/NO-GO の根拠 |
| Phase 12 | implementation-guide.md の根拠 |

## 多角的チェック観点（不変条件参照）

- **#1（schema 固定回避）**: 型 4 層を分離する必要性を Phase 1 で明示。ハードコードを Wave 0 から防ぐ
- **#5（apps/web → D1 禁止）**: ESLint rule placeholder を AC-3 で要求。後続 Wave 5/6 でも継続適用
- **#6（GAS prototype 非昇格）**: UI primitives 移植時に `localStorage` 依存を除去（Avatar / Toast）
- **#8（localStorage 非正本）**: Avatar の `hue` を `memberId` 由来に固定し localStorage 排除を Phase 1 で要件化
- **無料枠**: scaffold は資源を消費しないため考慮不要（後続 Wave で評価）
- **a11y**: Phase 1 では「primitives は a11y 最低基準を満たす」を要件化、Phase 5/9 で実体化

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点 4 件確定 | 1 | completed | issue 1〜4 を outputs/phase-01/main.md へ |
| 2 | 依存境界明文化 | 1 | completed | runtime / package / layer / D1 境界 |
| 3 | 4 条件 PASS 判定 | 1 | completed | 全条件 PASS の根拠記述 |
| 4 | AC-1〜AC-9 quantitative 化 | 1 | completed | 全 AC が exit code / 件数で判定可能 |
| 5 | 不変条件マッピング | 1 | completed | #1, #5, #6, #8 を全 Phase に伝播 |
| 6 | outputs 作成 | 1 | completed | outputs/phase-01/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 真の論点 / 依存境界 / 価値とコスト / 4 条件評価 / 不変条件マッピング |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] 真の論点 4 件、依存境界 4 区分、4 条件、AC-1〜AC-9、不変条件 #1/#5/#6/#8 が outputs/phase-01/main.md に明記
- [ ] 不変条件 #1, #5, #6, #8 が後続 Phase の「多角的チェック観点」に伝播される素地が整っている
- [ ] index.md の「含む」「含まない」と乖離しない

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（5 件）が completed
- [ ] outputs/phase-01/main.md が指定パスに配置済み
- [ ] AC-1〜AC-9 が quantitative
- [ ] 不変条件 #1/#5/#6/#8 が明記
- [ ] 4 条件評価が全 PASS
- [ ] artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: Phase 2（設計）
- 引き継ぎ事項: 真の論点 4 件 → module 設計 4 領域、依存境界 → Mermaid 構造図、AC-1〜AC-9 → test matrix
- ブロック条件: outputs/phase-01/main.md が未作成なら Phase 2 着手不可
