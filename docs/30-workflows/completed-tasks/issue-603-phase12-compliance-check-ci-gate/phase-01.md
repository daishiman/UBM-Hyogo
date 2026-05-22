# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #603 の要件を確定する。phase-12 compliance-check ファイル（`outputs/phase-12/phase12-task-spec-compliance-check.md`）の存在と canonical heading 整合性を CI で検証する gate を、既存歴史的 root に noise を出さず、spec-only root に runtime evidence を強制せず追加するスコープを切り分ける。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 1-1 | Gate-C0〜C2（着手 Gate）を確定する |
| 1-2 | 本サイクル scope を `verify script + workflow + fixture + skill/SSOT 同期` に限定する |
| 1-3 | spec-only root の取り扱い（runtime evidence 本文・列挙を optional 扱い）を確定する |

## 真の論点

- 論点 1: 検査対象の workflow root をどう決定するか
  - 結論: `pull_request` の changed files を `docs/30-workflows/<root>/**` 単位で集約し、変更があった root のみ検査対象とする。`completed-tasks/` 配下も含めるが、PR diff にない限り評価対象外
- 論点 2: spec-only root に runtime evidence 系見出しを要求するか
  - 結論: canonical heading 9 項目は常に要求する。`workflow_state=spec_created` の root では runtime evidence 本文・列挙だけを optional 扱いとする
- 論点 3: canonical heading の drift 防止方法
  - 結論: script が実行時に `phase12-compliance-check-template.md` の `Required Sections` を読み取り、検査見出し集合と一致するか自己検査する（drift 時は exit 2 で fail）
- 論点 4: warning モードで先行投入するか
  - 結論: 既存歴史的 root が PR diff に含まれることはほぼ無いため、最初から fail モードで投入する。fail 多発時は workflow `continue-on-error` で warning fallback 可能な構造を残す
- 論点 5: 検査見出しの粒度
  - 結論: skill reference の `Required Sections` 9 項目をそのまま canonical heading とする

## Gate decision table

| 判定状態 | 条件 | 結論 |
| --- | --- | --- |
| Gate-C0 | skill reference `phase12-compliance-check-template.md` の `Required Sections` 9 項目が確定している | 着手可 |
| Gate-C1 | pass / fail fixture 3 種が `scripts/__tests__/fixtures/phase12-compliance/` 配下に配置される | 中核実装着手可 |
| Gate-C2 | focused test 10 ケース PASS | workflow 投入可 |

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | phase-12 compliance-check の品質を CI で機械的に担保し、skill 側との drift を防ぐ |
| 実現 | verification script 1 本 + workflow 1 本 + fixture 3 種 + focused test で完結 |
| 整合 | skill reference を SSOT として扱い、script は実行時に同 reference を参照する |
| 運用 | 失敗時は workflow disable または script `continue-on-error` で即時 rollback 可 |

## 確定要件

- 新規 `scripts/verify-phase12-compliance.ts` で PR diff の workflow root 列挙 + heading 検査
- 新規 `.github/workflows/verify-phase12-compliance.yml` で PR 起動
- pass / fail fixture 3 種
- skill reference の Required Sections と script 検査見出しの drift 防止

## 完了条件

- [ ] Gate-C0〜C2 を `outputs/phase-01/main.md` に記述
- [ ] spec-only root に runtime evidence 本文・列挙を要求しない方針を明記
- [ ] 検査対象 root を PR diff に限定する方針を明記

## 出力

- `outputs/phase-01/main.md`（本 Phase の確定要件）

## 参照資料

- `index.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md`

## 統合テスト連携

- test 追加は Phase 9 で計画

## Next Phase

- [Phase 2](phase-02.md): 既存実装調査
