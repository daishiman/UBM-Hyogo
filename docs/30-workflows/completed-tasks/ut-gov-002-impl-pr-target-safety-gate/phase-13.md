# Phase 13: 完了確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 13 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| user_approval_required | true |
| GitHub Issue | #204（CLOSED のまま spec_created で扱う） |

## 目的

ユーザー承認ゲートとして Phase 1〜12 の成果物総和（仕様書 13 ファイル + outputs + 実 workflow 編集 2 ファイル + VISUAL evidence）を提示し、**PR 草案テンプレ**と **change-summary**を整え、承認を待つ。承認前は commit / push / PR 作成・branch protection 直接適用・Issue 状態変更の destructive オペレーションを一切行わない。Issue #204 は CLOSED のまま spec_created で扱い、本タスクは実 workflow 編集と dry-run 実走を含むが、PR 化はユーザー承認後に限る。

## 実行タスク

- `outputs/phase-13/main.md` 冒頭にユーザー承認ゲートであること（`user_approval_required: true`）と、承認なしでの destructive オペレーション禁止を明記する。
- `outputs/phase-13/local-check-result.md` にローカル確認結果を記録する：
  - `validate-phase-output`（task-specification-creator skill 提供）/ `verify-all-specs` 結果。
  - 計画系 wording grep（`grep -rE "予定|後ほど|今後|TODO" outputs/`）結果。
  - outputs 実体確認（Phase 1〜12 の各成果物が空でなく、相互リンクが切れていないこと）。
  - `actionlint` / `yq` / `gh run view --log` の実走ログが Phase 9 / 11 outputs に保存済みであることの再確認。
- `outputs/phase-13/change-summary.md` に 13 Phase 成果物索引と変更ファイル統計を記録する：
  - 追加（docs）：`docs/30-workflows/ut-gov-002-impl-pr-target-safety-gate/index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md` / 各 `outputs/phase-N/*`。
  - 追加 / 変更（実コード）：`.github/workflows/pr-target-safety-gate.yml`（追加または triage 専用化）/ `.github/workflows/pr-build-test.yml`（追加または untrusted build/test 分離）。各ファイルの追加 / 変更 / 削除行数統計を併記。
  - 削除：なし（既存 workflow を完全削除する場合は明示）。
- `outputs/phase-13/pr-template.md` に Title / Summary / Test plan / レビュアー指定方針 / dev → main 昇格手順を記述する：
  - **Title 例**：`feat(governance): UT-GOV-002-IMPL pull_request_target safety gate 実 workflow 編集と dry-run 実走`
  - **Summary（3-5 bullet）**：(1) UT-GOV-002 dry-run 仕様の実装適用（docs-only からの落とし込み）、(2) `pr-target-safety-gate.yml` を triage / metadata 専用化し、untrusted build / test を `pr-build-test.yml` に分離、(3) T-1〜T-5 dry-run smoke 実走と GitHub Actions UI / branch protection の VISUAL evidence 保存、(4) GitHub Security Lab の "pwn request" 非該当 5 箇条（PR head 非 checkout / `workflow_run` 非採用 / `head.*` 非 eval / `persist-credentials: false` / 最小 permissions）の証跡、(5) Issue #204 は CLOSED のまま spec_created で扱う。
  - **Test plan**：`actionlint` / `yq` による静的検査、`grep -E "persist-credentials|pull_request_target"` による禁止パターン検出、`gh run view --log` による secrets / token 露出ゼロ目視、`gh api repos/:owner/:repo/branches/main/protection` による required status checks 名同期確認。
  - **レビュアー指定方針**：solo 開発のため必須レビュアー数は 0。CI gate / 線形履歴 / 会話解決必須 / force push 禁止で品質を担保。
  - **dev → main 昇格手順**：`feature/issue-204-ut-gov-002-impl-pr-target-safety-gate` → `dev`（staging）→ `main`（production）の 2 段昇格。各昇格時に CI gate 通過と required status checks 名 drift がないことを確認する。
- `artifacts.json` で Phase 13 status を `pending` に固定し、`user_approval_required: true` を確認する。
- ユーザー承認後の遷移経路を明示：`feature/*` → `dev`（staging）→ `main`（production）。承認時の口頭 / チャット記録を `outputs/phase-13/main.md` 末尾に追記する欄を確保する。
- 承認なしでの destructive オペレーション（force push / branch protection 直接適用 / Issue 状態変更 / secrets rotate）の禁止を再宣言する。Issue #204 は CLOSED のまま操作せず、再オープンしない。
- secrets rotate / OIDC 化 / security review 最終署名 / secrets inventory automation は本 PR 対象外であり、後続別タスク（UT-GOV-002-EVAL / SEC / OBS）への委譲を `pr-template.md` の "Out of scope" セクションに明記する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `index.md`
- `artifacts.json`
- `outputs/phase-10/go-no-go.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/screenshots/`
- `outputs/phase-12/*`
- `CLAUDE.md`（ブランチ戦略 / solo 運用ポリシー）

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/local-check-result.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-template.md`

## 統合テスト連携

dry-run 実走（T-1〜T-5 smoke）と VISUAL evidence は Phase 11 の承認後実行手順で取得する。Phase 13 は仕様・実装差分候補・証跡取得計画の総和を提示してユーザー承認を待つゲートであり、PR 化 / merge / branch protection 反映は承認後に行う。承認待ち中は `pending` のまま固定する。

## 完了条件

- [ ] `main.md` にユーザー承認ゲート（`user_approval_required: true`）と destructive オペレーション禁止が明記されている。
- [ ] `local-check-result.md` に validate / verify / 計画系 wording grep / outputs 実体確認の結果が記録されている。
- [ ] `change-summary.md` に docs 追加 / 実 workflow 追加・変更の追加 / 変更 / 削除統計が記録されている。
- [ ] `pr-template.md` に Title / Summary（5 bullet）/ Test plan / レビュアー指定 / dev → main 2 段昇格手順 / Out of scope が記述されている。
- [ ] `artifacts.json` の Phase 13 status が `pending`（承認待ち）で固定されている。
- [ ] Issue #204 は CLOSED のまま操作しないことが明記されている。
- [ ] secrets rotate / OIDC 化 / security review 最終署名 / secrets inventory automation の後続別タスク委譲が明記されている。
- [ ] ユーザー承認なしの commit / push / PR 作成 / branch protection 直接適用 / Issue 状態変更を行わない。
