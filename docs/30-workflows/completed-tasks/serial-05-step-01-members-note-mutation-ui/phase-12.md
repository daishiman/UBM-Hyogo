# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 正本同期 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 11 (VISUAL Evidence) |
| 次 Phase | 13 (PR・振り返り) |
| 状態 | pending |

## 目的

Phase 1-11 で完成した hook / NoteForm / Drawer 拡張を、後続 step-02..08 が誤りなく再利用できるよう、関連正本ドキュメントに反映する。

---

## なぜ正本同期が必要か（中学生レベル）

「クラスのみんなで一つの大きな図画工作をしているとき、最初の人が作った『接着剤の使い方マニュアル』を、教室のみんなが見える場所に貼っておかないと、次の人がまた一から考えなおすことになります。step-01 で作った `useAdminMutation` という共通の『接着剤』は、step-02..05 でも同じように使われます。だから『これはこう使うものですよ』と、みんなが見る場所（仕様書 / skill / 親ワークフロー）に書き写しておく必要があります。」

---

## 正本同期対象

| 同期先 | 内容 | 担当 |
| --- | --- | --- |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/index.md` | step-01 完了 / hook surface URL を追記 | 本タスク |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-01-members-note/spec.md` | 「Status: completed」へ更新 + 実装 commit hash 追記 | 本タスク |
| `docs/00-getting-started-manual/specs/03-frontend.md`（存在する場合） | admin 系 hook の共通基盤として `useAdminMutation` を追記 | 本タスク |
| `.claude/skills/aiworkflow-requirements/references/` | admin mutation pattern を追記（hook surface / error shape / router.refresh 慣習） | 本タスク |
| step-02..08 の index.md / spec.md | 「step-01 完了 = hook が import 可能」を前提に依存セクション更新 | step-02..08 担当者へ通知 |

## Phase 12 strict 7 outputs（固定名）

| ID | 成果物 | 説明 |
| --- | --- | --- |
| O-12-1 | `outputs/phase-12/main.md` | Phase 12 entry point。Task 1-6 の実行サマリ |
| O-12-2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル） |
| O-12-3 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements / 親 workflow / step specs の same-wave sync 結果 |
| O-12-4 | `outputs/phase-12/documentation-changelog.md` | 変更履歴、実行コマンド、validator 結果 |
| O-12-5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出。0 件でも出力必須 |
| O-12-6 | `outputs/phase-12/skill-feedback-report.md` | テンプレ改善 / ワークフロー改善 / ドキュメント改善。改善なしでも出力必須 |
| O-12-7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Required Sections 1..9 を持つ Task 6 の最終確認 |

## phase12-task-spec-compliance-check 必須見出し

`outputs/phase-12/phase12-task-spec-compliance-check.md` は次の見出しをこの順で持つ。

1. Summary verdict
2. Changed-files classification
3. `workflow_state` and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict

## phase12 compliance check

- [ ] hook の public API surface が固定（`hooks/index.ts` の export と一致）
- [ ] step-02..08 が import するためのパスが文書化
- [ ] error shape が `apps/api/src/routes/admin/member-notes.ts` と整合
- [ ] design token 違反 0 が `pnpm verify:tokens` で再現可能
- [ ] coverage AC（>=80%）達成済
- [ ] 不変条件 6 件すべて満たされている
- [ ] root `artifacts.json` と `outputs/artifacts.json` の parity を実測。実装前 skeleton では `outputs/artifacts.json` 未生成理由を明記
- [ ] `outputs/phase-12/` strict 7 の物理存在を `find` / `test -f` で実測し、欠落時は `FAIL` 固定
- [ ] `skill-feedback-report.md` の各 item を owning skill / reference / lesson / no-op に routing
- [ ] aiworkflow-requirements の `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` の同期要否を記録
- [ ] Recovery Window Evidence Parity（recovery 経路ではない通常実装のため non-applicable と明記）

## 完了条件

- [ ] canonical O-12-1..O-12-7 作成
- [ ] 同期対象すべてに diff 適用 or not-needed の根拠を `system-spec-update-summary.md` に記録
- [ ] step-02..08 への handoff を親 workflow / step spec / implementation-guide のいずれかに同一 wave で反映

## タスク100%実行確認【必須】

- [ ] 同期先のうち更新したもの / 不要だったものを `system-spec-update-summary.md` にすべて記載
- [ ] skill 配下追記が必要な場合は owning skill / reference を同一 wave で更新。不要な場合は `skill-feedback-report.md` に no-op 理由を記録

## 次Phase

Phase 13 (PR・振り返り): 全成果物を 1 PR にまとめ `dev` へ。
