# Phase 12: ドキュメント更新 — meta-A-evidence-gate-dod-enforcement

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | meta-A-evidence-gate-dod-enforcement |
| phase | 12 / 13 |
| wave | meta-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | governance-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

正本仕様、runbook、lessons learned に「evidence gate」概念を追記し、後続 wave の本体タスクが本仕様を参照できるようにする。

## 中学生レベル概念説明（このタスクの肝を平易に）

「タスクが終わった」と「タスクが本当に終わった」は違う、という話を、宿題の例で説明する。

- 学校の先生に「宿題やりました！」と口で言うだけでは、本当にやったかどうか分からない。
- ノートを開いて、書いてあるページを見せて、初めて「ちゃんとやった」と認められる。
- もしまだ書けていないページがあったら、「来週までに出します」と紙に書いて先生に渡す。これが「未提出宿題リスト」(= followup) になる。

evidence gate は、この「ノートを見せる or 未提出リストを出す」を、タスクの完了条件としてシステムに固定する仕組みである。

| 学校の宿題 | このプロジェクトでの対応 |
| --- | --- |
| 「宿題やりました！」と口で言う | artifacts.json の status を completed にする |
| ノートを開いて見せる | outputs/phase-11/ に screenshot や curl ログを置く (= real evidence) |
| 未提出ページの紙を出す | followup タスク directory を発行する |
| 先生がノートも紙も無いと気づいて差し戻す | CI validator job が fail する / lefthook が止める |

つまり「言うだけで終わった事にする」ことを構造的に禁止し、「証拠を見せる」か「未提出リストを書く」かの二択を強制する。これが evidence gate である。

## 実行タスク

1. task-specification-creator skill の references/ に evidence gate 章を追加する spec を記述する。完了条件: 追記対象ファイル名と章タイトルが明記される。
2. CLAUDE.md の close-out 関連セクションに「evidence OR followup」一文を追記する spec を記述する。完了条件: 追記場所と一文が記録される。
3. lessons learned として「12 followup 連鎖はなぜ起きたか」を追記する spec を記述する。完了条件: 真因と対策の対応表が記録される。

## 参照資料

- .claude/skills/task-specification-creator/references/
- CLAUDE.md
- docs/30-workflows/02-application-implementation/_templates/
- 既存 12 followup タスク群（lessons learned source）

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/meta-A-evidence-gate-dod-enforcement/
- 本タスクは追記内容を spec として固定する。実ファイル更新は別 PR で実施。

## 統合テスト連携

- 上流: Phase 11 self-check
- 下流: Phase 13 PR 作成

## 多角的チェック観点

- skill governance（references/ 章追加の整合）
- audit traceability（lessons learned が真因に対応）
- CI gate 一貫性
- lefthook 軽量性
- 未実装/未実測を PASS と扱わない
- spec のみで完結する

## サブタスク管理

- [ ] skill references/ 追記 spec を記述
- [ ] CLAUDE.md 追記 spec を記述
- [ ] lessons learned spec を記述
- [ ] outputs/phase-12/main.md を作成する

## 成果物

- outputs/phase-12/main.md

## 完了条件

- skill references/ 追記対象と章タイトルが固定される
- CLAUDE.md 追記場所と一文が固定される
- 12 followup 真因 ↔ evidence gate 対策の対応表が記録される

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 中学生レベル概念説明と日常例えが含まれている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、追記対象リスト、lessons learned、approval gate を渡す。
