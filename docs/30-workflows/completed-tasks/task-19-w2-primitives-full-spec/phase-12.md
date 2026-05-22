# Phase 12: ドキュメンテーション（6 必須タスク）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋ドキュメント作成 task）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメンテーション（6 必須タスク） |
| 作成日 | 2026-05-07 |
| 前 Phase | 11（NON_VISUAL 縮約 smoke） |
| 次 Phase | 13（PR 作成） |
| 状態 | completed |
| タスク種別 | docs-only / NON_VISUAL |
| implementation_mode | docs |
| workflow_state | spec_created **据え置き**（docs-only ルール） |

## 目的

Phase 11 までの整合性 evidence を正本ドキュメントへ反映し、aiworkflow-requirements 同期 / 5 点同期 / 未タスク検出 / skill フィードバック / 仕様準拠チェックを 6 必須成果物として固定する。本 task は docs-only / coverage AC 適用外であり、root の `metadata.workflow_state` は `spec_created` 据え置き（completed への昇格は task-10 完了時、または当 task に runtime 実装が紐づく時に限る）。

## 視覚証跡セクション

UI/UX 変更なしのため Phase 11 screenshot 不要。代替証跡は `outputs/phase-11/evidence/grep-gate.log` / `markdown-lint.log` / `heading-count.log` を参照する。

## 実行タスク

| Task | 内容 | 主成果物 |
| ---- | ---- | -------- |
| Task 12-1 | 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| Task 12-2 | システム仕様書更新（Step 1-A: aiworkflow-requirements 同期、Step 1-B: 09-ui-ux.md からの 09c link 追加検討） | `outputs/phase-12/system-spec-update-summary.md` |
| Task 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| Task 12-4 | 未タスク検出レポート（0 件でも出力） | `outputs/phase-12/unassigned-task-detection.md` |
| Task 12-5 | スキルフィードバックレポート（3 観点固定） | `outputs/phase-12/skill-feedback-report.md` |
| Task 12-6 | タスク仕様書コンプライアンスチェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

- Task 12-1: 実装ガイド（Part 1=中学生レベル例え話 / Part 2=技術者向け詳細）
- Task 12-2: aiworkflow-requirements references 更新判定 + 09-ui-ux.md からの link 追加検討（task-06 への申し送り）
- Task 12-3: 変更履歴と validation 結果の記録
- Task 12-4: 未タスク検出（0 件でも出力）。**coverage 適用外につき layer 表は不要**。「pure-docs により coverage AC 対象外」と明記。
- Task 12-5: スキル改善提案（3 観点固定: テンプレ改善 / ワークフロー改善 / ドキュメント改善）
- Task 12-6: Task 12-1〜12-5 の準拠確認

> **必須**: 実行タスクは「表」と「`- Task 12-X:` 箇条書き」を**両方**残すこと。

## Task 12-5 スキルフィードバックレポート 3 観点（固定）

| 観点 | 記載内容 |
| ---- | -------- |
| テンプレ改善 | task-specification-creator の docs-only / NON_VISUAL 縮約テンプレに対する改善提案 |
| ワークフロー改善 | docs-only task における `workflow_state` 据え置きルールの運用上の改善提案 |
| ドキュメント改善 | `phase-11-non-visual-alternative-evidence.md` への追加候補（17 primitive 仕様書系の 3 evidence 標準等） |

## Task 12-4 未タスク検出（layer 表 不要）

本 task は **pure-docs により coverage AC 対象外**。`unassigned-task-detection.md` には以下を最低限記載する:

- 検出件数（0 件でも明示）
- 検出 0 件であっても、後続 task-10 / task-06 / task-20-22 が依存契約を保持していることの確認文
- coverage layer 表は作成しない（理由: docs-only / 実装層を持たないため）

## 5 点同期チェックリスト【FB-04】

- [ ] index.md の Phase 状態
- [ ] artifacts.json の phase status / outputs（**root workflow_state は spec_created 据え置き**）
- [ ] phase-*.md の outputs パス
- [ ] outputs/ 実体ファイルの存在
- [ ] aiworkflow-requirements references の整合（Step 1-A 判定結果と一致）

## 実行手順

### ステップ 1: 必須 6 成果物の作成

- `implementation-guide.md` を Part 1 / Part 2 構成で作成。Part 1 は「primitive = LEGO ブロック / token = 色見本帳 / 09c = 部品カタログ」の例え話で開始。
- `system-spec-update-summary.md` は Step 1-A（aiworkflow-requirements 更新判定）と Step 1-B（09-ui-ux.md → 09c link 追加検討 / task-06 への申し送り）を分けて記録。
- `documentation-changelog.md` に 09c 新規作成 / phase-10〜13 仕様書追加を時系列記録。
- `unassigned-task-detection.md` は coverage AC 対象外明記 + 0 件でも出力。
- `skill-feedback-report.md` は 3 観点固定で記載（改善点なしでも「該当なし」と明記）。
- `phase12-task-spec-compliance-check.md` で Task 12-1〜12-5 を 1:1 trace。

### ステップ 2: aiworkflow-requirements 更新判定

- 09c は新規 specs 追加であり、aiworkflow-requirements の `references/` には primitive 仕様への direct dependency が現状無い。
- Step 1-A 判定: 「更新必要」（理由: 09c は task-10 の canonical primitive spec であり、aiworkflow-requirements の quick-reference / resource-map / task-workflow-active から発見可能にする必要がある）。
- Step 1-B: `docs/00-getting-started-manual/specs/09-ui-ux.md`（task-06 成果物）から 09c への index link 追加は task-06 側の責務として申し送る。本 task では link を追加しない（diff scope 規律）。

### ステップ 3: 5 点同期と検証

- 5 点同期チェックリストを `phase12-task-spec-compliance-check.md` に転記。
- root `metadata.workflow_state = spec_created` 据え置きであることを `system-spec-update-summary.md` 末尾に明記。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | task 正本 |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | 本 task 単一成果物 |
| 必須 | outputs/phase-10/final-review-result.md | gate 結果 |
| 必須 | outputs/phase-11/evidence/*.log | 整合性検査 evidence |
| 参考 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 6 必須タスク構造 |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | §6 diff scope 規律 |

## Phase 12 必須成果物（strict 7 files・全て必須）

| # | 成果物 | パス | 補足 |
| --- | --- | --- | --- |
| 0 | Phase 12 main | outputs/phase-12/main.md | strict 7 files index |
| 1 | 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1=中学生例え話 / Part 2=技術詳細 |
| 2 | system spec 更新概要 | outputs/phase-12/system-spec-update-summary.md | Step 1-A + Step 1-B 分離記載 |
| 3 | changelog | outputs/phase-12/documentation-changelog.md | 09c 新規作成記録 |
| 4 | unassigned task 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも出力 / layer 表不要 |
| 5 | skill feedback | outputs/phase-12/skill-feedback-report.md | 3 観点固定 |
| 6 | compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 12-1〜12-5 準拠確認 |

## Part 1 中学生レベル概念説明（例え話）

primitive は LEGO ブロックで、Button / Card / Badge ... の 17 種類。token は LEGO に塗る色のサンプル帳（例: `--ubm-color-accent` = 「アクセント青」）。09c-primitives.md は「どのブロックがどの形・どんな色（名前）で組み合わせるとどう動くか」を全部書いた**部品カタログ**。実際にブロックを作る作業は task-10、ブロックで作品（画面）を組み立てるのは task-20〜22。本 task はカタログだけ作って机に置く。

## Part 2 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | docs/30-workflows/task-19-w2-primitives-full-spec |
| 単一成果物 | docs/00-getting-started-manual/specs/09c-primitives.md（600〜1200 行） |
| primitive 数 | 17（Button / Card / Badge / Input / Field / Select / Switch / Segmented / Sidebar / Stat / EmptyState / Avatar / Banner / Drawer / Modal / Toast / KVList / LinkPills）+ §99 不採用 3 件 |
| token 参照 | `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-space-*` / `--ubm-text-*` / `--ubm-font-*` （値は 09b、本 task は名前のみ） |
| grep gate | HEX / oklch / px / `bg-[` の 4 grep が 0 件で PASS |
| upstream | task-01（scope-gate-all-screens 完了のみ） |
| downstream | task-06（09-ui-ux 契約 link）/ task-07（09a mapping）/ task-08（09b tokens）/ task-10（ui-primitives 実装）/ task-20-22（screen blueprint 採用例） |
| validation focus | DoD § 8 の 8 項目 + §6.2 grep 4 件 + markdown lint error 0 |
| coverage AC | **適用外（pure-docs）** |
| workflow_state | spec_created 据え置き |

## aiworkflow-requirements 更新トリガー

- D1 schema 変更: なし（本 task は specs 配下のみ）→ `architecture-overview-core.md` 更新不要
- API 境界変更: なし → references 更新不要
- secret / env 配置変更: なし → `environment-variables.md` 更新不要
- 結論: **更新必要**。quick-reference / resource-map / task-workflow-active へ task-19 / 09c discoverability を追加する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | 本 Phase の 6 成果物を PR body / 添付に同梱 |
| Phase 11 | 3 evidence を compliance check の根拠として参照 |
| task-10 | implementation-guide.md Part 2 を実装着手の onboarding 入口として渡す |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 6 成果物作成 | 12 | pending | 必須全件 |
| 2 | aiworkflow-requirements 更新判定 | 12 | pending | Step 1-A |
| 3 | 09-ui-ux.md link 追加検討 / 申し送り | 12 | pending | Step 1-B（task-06 へ） |
| 4 | 5 点同期 | 12 | pending | チェックリスト |
| 5 | workflow_state 据え置き明記 | 12 | pending | spec_created 維持 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1 中学生 + Part 2 技術者 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1-A / Step 1-B 分離 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 0 件でも出力 / coverage AC 対象外明記 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 3 観点固定 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 12-1〜12-5 準拠 |
| メタ | artifacts.json | Phase 状態と outputs の記録（root workflow_state 据え置き） |

## 完了条件

- [ ] 必須 6 成果物が全て存在
- [ ] 5 点同期チェックリストが全 PASS
- [ ] aiworkflow-requirements 更新可否が記録済み（**更新必要 / 同期済み**判定）
- [ ] 実行タスクを「表」と「`- Task 12-X:` 箇条書き」両形式で記載済み
- [ ] Task 12-5 skill-feedback-report が 3 観点固定で出力済み
- [ ] Task 12-4 unassigned-task-detection に「coverage AC 対象外（pure-docs）」と明記
- [ ] root `metadata.workflow_state = spec_created` 据え置きを明記

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（5 点同期で drift 検出 / 6 成果物欠損）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の該当 phase を completed に更新（**root workflow_state は変更しない**）

## 次 Phase

- 次: 13（PR 作成）
- 引き継ぎ事項: 6 成果物と changelog を PR body に転記する。
- ブロック条件: 6 成果物が揃わない場合、または root workflow_state を誤って completed に書き換えた場合は Phase 13 に進まない。

## 苦戦箇所（事前想定）

### 1. coverage AC 適用外 task の `unassigned-task-detection.md` テンプレ流用

- **想定症状**: 既存 unassigned-task-detection テンプレが coverage layer 表を含むため、docs-only task で誤って layer 表を空 fill してしまう。
- **対策**: 本 phase-12 仕様書の Task 12-4 セクションで「layer 表不要 / coverage AC 対象外」を明示。

### 2. `workflow_state = completed` への昇格誘惑

- **想定症状**: 全 phase artifact を completed にすると root state も completed に書き換えたくなる。
- **対策**: 本仕様書全体（メタ情報 / 実行手順 / 成果物 / 完了条件）で `spec_created` 据え置きを 5 箇所以上で明記。
