# タスク仕様書: Issue #603 — phase-12 compliance-check の CI gate 化

[実装区分: 実装仕様書]

判定根拠: Issue #603 は CLOSED（2026-05-11T03:11:38Z）だが、現状 `.github/workflows/` 配下に `phase12-task-spec-compliance-check.md` の存在および canonical heading 整合を検証する gate が存在せず、`scripts/` 配下にも検証スクリプトが無いことを確認した（`rg 'phase12-task-spec-compliance-check\|phase12-compliance-check-template' .github/ scripts/` で 0 件）。本タスクは CI workflow（`.github/workflows/verify-phase12-compliance.yml`）+ verification script（`scripts/verify-phase12-compliance.ts`）+ pass/fail fixture + skill/SSOT 同期を伴うため、CONST_004 のデフォルトに従い実装仕様書として作成する。Issue #603 は CLOSED 維持で `Refs #603` のみを使う（`Closes/Fixes/Resolves` は使わない）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-603-phase12-compliance-check-ci-gate |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/603 |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md` |
| 親タスク | `docs/30-workflows/completed-tasks/issue-534-skill-workflow-state-guidance/`（参照のみ） |
| 配置先 | `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/` |
| 作成日 | 2026-05-11 |
| 状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| artifacts parity | `artifacts.json` と `outputs/artifacts.json` を同値配置（`cmp -s artifacts.json outputs/artifacts.json` で検証） |
| 優先度 | LOW（issue label `priority:low`） |
| Wave | follow-up（#534 派生） |
| 想定 PR 数 | 1（verification script + workflow + fixture + skill/SSOT 同期） |
| coverage AC | 適用外（`scripts/` / `.github/workflows/` / `docs/` 配下。focused unit test を追加） |

## スコープ

### 含む（scope in）

- 新規 verification script `scripts/verify-phase12-compliance.ts`
- focused test `scripts/__tests__/verify-phase12-compliance.test.ts`
- 新規 workflow `.github/workflows/verify-phase12-compliance.yml`（PR diff で `docs/30-workflows/**` 変更時 trigger）
- pass / fail fixture `scripts/__tests__/fixtures/phase12-compliance/{pass,fail-missing-file,fail-missing-heading}/outputs/phase-12/phase12-task-spec-compliance-check.md`
- skill 同期: `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` の Required Sections と script の検査見出しの drift 防止文言追記
- SSOT 同期: `.claude/skills/aiworkflow-requirements/references/deployment-core.md` / `task-workflow-active.md` / artifact inventory / changelog に CI gate 名と検査対象見出しを追記
- 既存歴史的 workflow root に対する除外（PR diff の変更 root のみ対象）

### 含まない（scope out / 別タスク）

- Phase 12 strict 7 ファイル名の変更（CONST: 逐語固定維持）
- workflow_state hook（別タスク #602）
- spec-only root への runtime evidence 要求（spec-only タスクには適用しない）

## 不変条件

1. spec-only root（`artifacts.json.workflow_state=spec_created`）に runtime evidence を要求しない
2. 検査範囲は PR diff で変更された workflow root のみに限定する（`docs/30-workflows/<name>/**` 単位）
3. canonical heading は skill reference（`phase12-compliance-check-template.md`）の `Required Sections` 9 項目と同値に維持する
4. `completed-tasks/` 配下の歴史的 root は変更が無い限り評価対象外

## 苦戦箇所（Issue body より）

- spec-only root と implementation root の workflow class が混在する
- gate は spec-only タスクに runtime evidence を要求してはならない

## リスクと対策

| Risk | Mitigation |
| --- | --- |
| CI が既存歴史的 root を block する | PR diff の変更 root のみ検査対象に限定 |
| Template が stale になる | script は skill reference の `Required Sections` を実行時に読み取り、同値比較する |
| spec-only root に runtime evidence を強制する | `artifacts.json.workflow_state=spec_created` の場合も canonical heading 9 項目は必須とし、runtime evidence 本文・列挙だけを optional として扱う |

## 検証方法

- pass / fail fixture を focused test 経由で検査し expected result を確認
- fail-missing-file fixture で `reason=missing-file` を確認
- fail-missing-heading fixture で `reason=missing-heading` を確認
- temporary git repository で changed-root collection / untracked root / completed-tasks / moved-root delete semantics を確認
- 実 PR で本 task の workflow root を変更し、`verify-phase12-compliance` job が PASS することを確認

## AC

- AC-1: `scripts/verify-phase12-compliance.ts` が PR diff の workflow root 列挙、`outputs/phase-12/phase12-task-spec-compliance-check.md` の存在と canonical heading 9 項目を検査する
- AC-2: focused test 10 ケース（pass / fail-missing-file / fail-missing-heading / drift-detection / spec-only runtime evidence optional / canonical headings count / tracked root collection / untracked root + unassigned-task exclusion / completed-tasks ancestor marking / moved-root deleted old path skip）が全て成功
- AC-3: `.github/workflows/verify-phase12-compliance.yml` が `pull_request` の `docs/30-workflows/**`、同 workflow、自身の package script、検証 script/test/fixture、canonical template 変更時に起動する
- AC-4: spec-only root（`workflow_state=spec_created`）には runtime evidence 本文・列挙の欠落で fail しない。canonical heading 9 項目の存在は常に必須
- AC-5: `completed-tasks/` 配下の歴史的 root が PR diff に含まれない限り評価対象外
- AC-6: skill reference の `Required Sections` と script の検査見出しが同一（drift 防止 comment 追記）
- AC-7: SSOT に CI gate 名（`verify-phase12-compliance`）と検査対象見出しを追記
- AC-8: PR diff で本 root を含む状態で `verify-phase12-compliance` PASS（evidence: `outputs/phase-11/evidence/local-verify.log`。PR CI job log は PR 作成後に user-gated で取得）
- AC-9: `pnpm typecheck` / `pnpm lint` / focused test PASS
- AC-10: `unassigned-task/task-spec-skill-compliance-check-ci-gate.md` を `completed-tasks/` 配下にアーカイブ、または本 root へ統合する旨を Phase 12 で明記
- AC-11: `Refs #603` でリンクし、Issue は CLOSED 維持
- AC-12: forward-safe rollback（workflow disable / script 削除）で復旧できる構造

## DoD

- AC-1〜AC-12 全て満たすこと
- `outputs/phase-12/` strict 7 ファイル全て存在
- artifacts.json parity 確認済み

## 参照資料

- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md`
- `docs/30-workflows/completed-tasks/issue-534-skill-workflow-state-guidance/`（親）

## Phase 一覧

- [Phase 1](phase-01.md): 要件定義 / Gate / 真の論点
- [Phase 2](phase-02.md): 既存実装調査
- [Phase 3](phase-03.md): アーキテクチャ / interface 設計
- [Phase 4](phase-04.md): 前提整備 / 依存確認
- [Phase 5](phase-05.md): 中核実装（verification script）
- [Phase 6](phase-06.md): 周辺実装（workflow / fixture）
- [Phase 7](phase-07.md): 横断整備（skill / SSOT 同期）
- [Phase 8](phase-08.md): セキュリティ / 安全性
- [Phase 9](phase-09.md): テスト戦略
- [Phase 10](phase-10.md): 品質基準
- [Phase 11](phase-11.md): evidence path 予約
- [Phase 12](phase-12.md): 実装ガイド / SSOT / 未タスク / skill feedback
- [Phase 13](phase-13.md): PR 作成
