# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

実装ガイド・spec sync・changelog・unassigned task 検出・skill feedback・compliance check の 6 成果物を生成し、後続 task / 別 wave へ正しく handoff する。

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

1. `outputs/phase-12/implementation-guide.md` を生成
2. `outputs/phase-12/system-spec-update-summary.md` を生成
3. `outputs/phase-12/documentation-changelog.md` を生成
4. `outputs/phase-12/unassigned-task-detection.md` を生成
5. `outputs/phase-12/skill-feedback-report.md` を生成
6. `outputs/phase-12/phase12-task-spec-compliance-check.md` を生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/ | 全成果物 |
| 必須 | doc/00-getting-started-manual/specs/05, 09, 11, 12, 16 | spec sync 対象 |

## Phase 12 必須成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Phase 5 runbook + Phase 8 命名 + 中学生レベル概念説明 |
| system spec update | outputs/phase-12/system-spec-update-summary.md | specs/ への反映が必要な命名・契約変更 |
| changelog | outputs/phase-12/documentation-changelog.md | 本タスクで生まれた path / endpoint / type の変更履歴 |
| unassigned | outputs/phase-12/unassigned-task-detection.md | 本タスクで処理しなかった項目（管理者管理 UI 等）の登録先候補 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | task-specification-creator skill への改善提案 |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 #1〜#15 の遵守状況、AC trace |

## Part 1 中学生レベル概念説明 (例え話)

`/admin` 画面群は学校の事務室にあたる。
- `dashboard` は出席簿の表紙（全体の状況がひと目で分かる）
- `/admin/members` は生徒名簿（一覧 + 個別詳細）。先生は名前や住所を勝手に書き換えない（生徒本人が記入する Form がある）
- `/admin/tags` はクラブ振り分けノート（管理者がレビューして決める）
- `/admin/schema` は提出書類のフォーマット変更点を集めるバインダー（一箇所に集約）
- `/admin/meetings` は授業出席記録（同じ生徒を 2 回出席にしない、退学生は出席候補に出ない）

## Part 2 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | doc/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| key outputs | outputs/phase-02/admin-pages-design.md, outputs/phase-05/admin-implementation-runbook.md, outputs/phase-07/ac-matrix.md |
| upstream | 04c-parallel-admin-backoffice-api-endpoints, 05a-parallel-authjs-google-oauth-provider-and-admin-gate, 05b-parallel-magic-link-provider-and-auth-gate-state, 00-serial-monorepo-shared-types-and-ui-primitives-foundation |
| downstream | 07a-parallel-tag-assignment-queue-resolve-workflow, 07b-parallel-schema-diff-alias-assignment-workflow, 07c-parallel-meeting-attendance-and-admin-audit-log-workflow, 08a-parallel-api-contract-repository-and-authorization-tests, 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| validation focus | AC 10 件 + 不変条件 #4, #5, #11, #12, #13, #14, #15 |

## system spec 更新概要

- specs/05-pages.md と本 task の URL マッピング齟齬がないことを確認
- specs/11-admin-management.md の操作 UI 表と本 task の component 表の整合
- specs/12-search-tags.md の queue 仕様と TagQueuePanel の整合
- specs/16-component-library.md の Drawer / Modal 仕様と本 task の使用箇所の整合
- 反映が必要な変更は本 wave 内で完結（命名 `patchMember*` の確定等）

## documentation-changelog

| 日付 | 変更 | 影響範囲 |
| --- | --- | --- |
| 2026-04-26 | `/admin/*` 5 画面の component 設計確定 | apps/web |
| 2026-04-26 | adminApi 命名規則確定（`fetchAdmin*` / `patch*` / `post*` / `delete*`） | apps/web |
| 2026-04-26 | ESLint rule (no-restricted-imports) で D1 直 import 禁止 | apps/web |
| 2026-04-26 | 不変条件 #4, #11, #13, #14, #15 を UI 設計で担保 | apps/web |

## unassigned-task-detection

| 未割当項目 | 理由 | 登録先候補 |
| --- | --- | --- |
| `/admin/users` 管理者管理 UI | spec で明示的に不採用 | 別 task（運用要請発生時） |
| profile 本文の管理者直接編集 | 不変条件 #11 | 採用しない |
| タグ辞書 / ルール編集 UI | spec 12 で不採用 | 別 task（条件を満たす場合は） |
| 物理削除 UI | spec で不採用 | 採用しない |

## skill feedback

| skill | feedback |
| --- | --- |
| task-specification-creator | UI タスクの component 階層を Mermaid で表現する形式が phase-2 に追加されると良い |
| aiworkflow-requirements | admin pages の prototype-to-spec マッピング（specs/05 と claude-design-prototype）が reference にあると参照効率が上がる |

## phase12-task-spec-compliance-check

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しない | ✅ | stableKey 経由のみ参照 |
| #2 consent キー統一 | ✅ | publicConsent / rulesConsent のみ |
| #3 responseEmail = system field | ✅ | UI で system 扱い |
| #4 本人本文編集禁止 | ✅ | drawer に input なし |
| #5 D1 直接アクセス禁止 | ✅ | ESLint rule |
| #6 GAS prototype 非昇格 | ✅ | spec 09/11/12 のみ参照 |
| #7 responseId と memberId 混同なし | ✅ | branded type |
| #8 localStorage 非正本 | ✅ | URL ベース |
| #9 /no-access 不依存 | ✅ | layout.tsx で redirect |
| #10 無料枠内 | ✅ | 0.2% 使用 |
| #11 他人本文編集禁止 | ✅ | readOnly prop |
| #12 admin_member_notes 漏れなし | ✅ | drawer のみ |
| #13 tag は queue 経由 | ✅ | drawer に form なし |
| #14 schema 集約 | ✅ | `/admin/schema` のみ |
| #15 attendance 重複 + 削除済み除外 | ✅ | UI filter + DB constraint |

## LOGS.md 記録

- 変更要約: `/admin/*` 5 画面の spec 完成
- 判定根拠: AC 10 件 trace、不変条件 7 件すべて担保
- 未解決事項: 上流 04c, 05a, 05b の AC が完了次第 Phase 10 を再評価

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR 説明文に compliance check を埋め込み |
| 後続 wave 7a/b/c | implementation-guide を入力 |
| 後続 wave 8a/b | AC マトリクスと test 計画を入力 |

## 多角的チェック観点

| 不変条件 | 確認 | 結果 |
| --- | --- | --- |
| #1〜#15 | compliance check の 15 行 | 全 ✅ |
| spec sync | specs/05, 09, 11, 12, 16 と齟齬なし | OK |
| handoff | 07a/b/c, 08a/b に渡せる成果物がある | OK |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md | 12 | pending | Part 1 + Part 2 |
| 2 | system-spec-update-summary.md | 12 | pending | spec 反映 |
| 3 | documentation-changelog.md | 12 | pending | 変更履歴 |
| 4 | unassigned-task-detection.md | 12 | pending | 未処理項目 |
| 5 | skill-feedback-report.md | 12 | pending | skill 改善 |
| 6 | phase12-task-spec-compliance-check.md | 12 | pending | 不変条件 trace |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリー |
| ドキュメント | outputs/phase-12/implementation-guide.md | 中学生 + 技術者 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 反映 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未処理 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill 改善 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | trace |
| メタ | artifacts.json | Phase 12 を completed |

## 完了条件

- [ ] 6 成果物すべて作成
- [ ] compliance check で不変条件 15 件すべて ✅
- [ ] spec sync 漏れなし

## タスク100%実行確認

- 全 6 成果物に内容
- artifacts.json で phase 12 を completed

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ: 6 成果物を PR description に
- ブロック条件: compliance check で violation あれば差し戻し
