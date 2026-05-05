# meta-A-evidence-gate-dod-enforcement

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | meta-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / governance-meta |
| visualEvidence | NON_VISUAL |

## purpose

本体タスクの close-out DoD に「real evidence captured (visual or runtime) OR follow-up issued」evidence gate を governance level で組み込み、本体タスクが docs-only / scaffold-only で `completed` 化することを構造的に防ぐ。task-specification-creator skill / CI workflow / lefthook の三層で gate を固定し、再発防止の正本仕様を確定する。

## why this is not a restored old task

このタスクは特定機能の実装・復活ではなく、過去 12 個の followup が発生した真因 = 本体タスクの DoD に evidence gate が無かったこと、への根治策である。

`05b-B` 以下、`06a/06b/08a/08b/09a/09b/09c` に積み上がった followup は、いずれも「本体タスク完了時に visual / runtime evidence が NOT_EXECUTED placeholder のまま spec_created → completed が許容された」という同一構造から発生している。本タスクは個別機能を再実装するものではなく、close-out criteria を skill / CI / hook で固定して同種 followup の再発を防ぐ meta-control の仕様書である。

## scope in / out

### Scope In
- task-specification-creator skill の Phase 12 / Phase 13 に evidence gate 定義を追記する spec
- artifacts.json schema に `evidenceCaptured` / `followupIssued` 必須化の spec
- `.github/workflows/` に evidence gate validator job 追加の spec
- lefthook pre-push に軽量 evidence presence check 追加の spec
- 本体タスクの completion definition に evidence OR followup の OR ゲート明記

### Scope Out
- skill 本体ファイル / workflow YAML / lefthook.yml への直接コード変更（本タスクは spec のみ）
- 既存 18 followup（05b-A/B, 06a-A, 06b-A/B/C, 06c-A/B/C/D/E, 08a-A/B, 08b-A, 09a-A, 09b-A/B, 09c-A）の再仕様化
- visual evidence 撮影フロー自体の再設計
- secret 値や production endpoint の記録
- 未承認 commit / push / PR

## dependencies

### Depends On
- 05b-A / 05b-B
- 06a-A
- 06b-A / 06b-B / 06b-C
- 06c-A / 06c-B / 06c-C / 06c-D / 06c-E
- 08a-A / 08a-B / 08b-A
- 09a-A / 09b-A / 09b-B / 09c-A
- task-specification-creator skill
- aiworkflow-requirements skill
- `.github/workflows/verify-indexes.yml` の gate 設計（参考）

### Blocks
- future regression of "completed without evidence" pattern
- 後続 wave での本体タスク close-out 時の DoD 不整合発生

### 内部依存
- skill spec 更新と CI validator 追加と lefthook 追加は独立 PR で着手可能（parallel）。本仕様書は 3 層を 1 タスクで束ねて governance gate 全体像を確定する。

## refs

- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/task-specification-creator/references/phase-12-spec.md
- .claude/skills/aiworkflow-requirements/
- docs/30-workflows/02-application-implementation/_templates/task-index-template.md
- docs/30-workflows/02-application-implementation/_templates/phase-template-app.md
- docs/30-workflows/02-application-implementation/_templates/phase-meaning-app.md
- docs/30-workflows/02-application-implementation/_templates/artifacts-template.json
- docs/30-workflows/02-application-implementation/06b-A-me-api-authjs-session-resolver/
- .github/workflows/verify-indexes.yml
- lefthook.yml

## AC

- task-specification-creator skill の Phase 12 / 13 spec に evidence gate 判定基準が明記される
- artifacts.json schema に `evidenceCaptured` / `followupIssued` フィールドの必須化方針が記載される
- CI validator job の入出力契約（artifacts.json 参照、outputs/phase-11/ 走査、followup ref 検査）が spec として固まる
- lefthook pre-push の opt-in evidence presence check の責務境界が明記される
- `visualEvidence == "VISUAL"` 時は `outputs/phase-11/` に screenshot 系成果物 1 件以上、`NON_VISUAL` 時は curl/wrangler 等の runtime evidence、いずれも欠落時は対応 followup タスク参照が必須、というルールが文書化される
- spec のみで完結し、skill / workflow / hook ファイルの直接変更を含まない

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- skill governance（task-specification-creator の Phase 12 / 13 仕様）
- audit traceability（artifacts.json と outputs/phase-11/ の対応関係）
- close-out DoD 不変条件（spec_created → completed without evidence の禁止）
- CI gate 一貫性（verify-indexes と evidence gate の整合）

## completion definition

全 13 phase 仕様書、index.md、artifacts.json が揃い、skill / CI / lefthook 三層に対する evidence gate spec の境界、入出力契約、approval gate が明記されていること。skill 本体・workflow YAML・lefthook.yml の直接コード変更、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
