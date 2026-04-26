# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 12 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 11 (手動 smoke) |
| 下流 Phase | 13 (PR 作成) |
| 状態 | completed |

## 目的

implementation guide / changelog / unassigned task / compliance check / skill feedback の 6 種を生成し、後続 Wave 1〜9 が「Wave 0 で何が決まり何が未決か」を一意に参照できるようにする。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. `implementation-guide.md` 生成（後続 Wave 1〜9 への引き渡しガイド）
2. `system-spec-update-summary.md` 生成（specs/ への更新有無）
3. `documentation-changelog.md` 生成（doc 変更点）
4. `unassigned-task-detection.md` 生成（未割当作業の検出）
5. `skill-feedback-report.md` 生成（task-specification-creator skill への feedback）
6. `phase12-task-spec-compliance-check.md` 生成（13 phase 全準拠確認）
7. outputs/phase-12/main.md 集約

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/ | 全 phase 成果 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave マトリクス |
| 必須 | CLAUDE.md | 不変条件 |

## 実行手順

### ステップ 1: 6 ドキュメント生成
### ステップ 2: 整合性確認（specs/ との差分）
### ステップ 3: outputs/phase-12/main.md 集約

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR description で changelog を参照 |
| 後続 Wave | implementation-guide で着手指示 |

## 多角的チェック観点（不変条件参照）

- **#1**: 型 4 層分離が後続 Wave で破られないようガイドに明記
- **#5**: ESLint rule の継続適用を後続 Wave に明記
- **#6**: primitive 拡張時の localStorage 禁止を明記
- **#8**: 同上

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | completed | 後続 Wave 引き渡し |
| 2 | system-spec-update-summary.md | 12 | completed | specs 更新なしを記録 |
| 3 | documentation-changelog.md | 12 | completed | doc 差分 |
| 4 | unassigned-task-detection.md | 12 | completed | 0 件目標 |
| 5 | skill-feedback-report.md | 12 | completed | spec creator feedback |
| 6 | phase12-task-spec-compliance-check.md | 12 | completed | 13 phase 準拠 |
| 7 | outputs/phase-12/main.md 集約 | 12 | completed | サマリー |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | 後続 Wave 引き渡しガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | specs/ 差分 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | doc 変更点 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 13 phase 準拠 |
| メタ | artifacts.json | Phase 12 を completed |

## 完了条件

- [ ] 6 ドキュメントすべて生成
- [ ] implementation-guide.md が後続 Wave 1a/1b で「Wave 0 完了の確認方法」を明示
- [ ] compliance check で 13 phase が phase-template-app.md 準拠確認

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスク completed
- [ ] outputs/phase-12/ 配下に 7 ファイル配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 13（PR 作成）
- 引き継ぎ事項: changelog → PR description
- ブロック条件: 6 ドキュメントの 1 つでも欠けていれば不可

## implementation-guide.md（要約）

後続 Wave への引き渡し:

| 後続 Wave | 確認項目 |
| --- | --- |
| 01a | `apps/api/wrangler.toml` の `[[d1_databases]]` placeholder を本番 ID で更新 |
| 01b | `packages/shared/src/types/{schema,response,identity,viewmodel}/index.ts` の空 module を実装で埋める |
| 02a/b/c | `apps/api/src/repository/` 配下に repo 実装、ESLint で apps/web からの import が禁止されていることを再確認 |
| 03a/b | `packages/integrations/google/src/forms-client.ts` interface を実装 |
| 04a/b/c | `apps/api/src/index.ts` の Hono に endpoint を追加、`/healthz` は維持 |
| 05a/b | Auth.js 設定は `apps/web/src/app/api/auth/[...nextauth]/route.ts` に配置 |
| 06a/b/c | `apps/web/src/components/ui/` の 15 primitives を再利用、新規 layout / member / admin 系は別ディレクトリ |
| 07a/b/c | repository を経由、apps/web から直接呼ばない |
| 08a/b | typecheck / lint / test / scaffold-smoke を必ず先に通す |
| 09a/b/c | Wave 0 の `wrangler.toml` placeholder を本番値に更新 |

## system-spec-update-summary.md（要約）

- 正本仕様への更新: architecture-monorepo.md, ui-ux-components.md, technology-devops-core.md
- このタスクは specs/ を消費するだけで、specs/ に変更は加えない

## documentation-changelog.md（要約）

- 新規: docs/00-serial-monorepo-shared-types-and-ui-primitives-foundation/ 配下に 15 ファイル
- 変更: canonical path/status/Phase 12 evidence/system spec sync を更新
- 削除: Wave 0 scope 外の API sync/D1/cron/secret 実装を削除

## unassigned-task-detection.md（要約）

- 検出: 0 件（このタスクの責務は scope に閉じている）

## skill-feedback-report.md（要約）

- task-specification-creator skill への feedback: phase 1-13 構造が Wave 0 のような scaffold タスクにも適用可能。ただし「実装タスクなし」のフラグがあると親切

## phase12-task-spec-compliance-check.md（要約）

| Phase | template 準拠 | Phase 別追加セクション | 不変条件マッピング |
| --- | :---: | :---: | :---: |
| 1 | OK | 4 条件 / 真の論点 / 依存境界 / 価値とコスト | OK |
| 2 | OK | Mermaid / env / matrix / module 設計 | OK |
| 3 | OK | alternative 3 案 / PASS-MINOR-MAJOR | OK |
| 4 | OK | verify suite | OK |
| 5 | OK | runbook / placeholder / 擬似コード / sanity | OK |
| 6 | OK | failure cases | OK |
| 7 | OK | AC matrix | OK |
| 8 | OK | Before/After | OK |
| 9 | OK | free-tier / secret hygiene / a11y | OK |
| 10 | OK | GO/NO-GO / blocker | OK |
| 11 | OK | manual evidence | OK |
| 12 | OK | 6 ドキュメント | OK |
| 13 | OK | approval gate / local-check / change-summary / PR template | （Phase 13 で確認） |
