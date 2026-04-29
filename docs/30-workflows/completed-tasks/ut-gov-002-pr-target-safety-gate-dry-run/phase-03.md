# Phase 03: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 3 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

Phase 2 の責務分離設計を、複数代替案の比較と PASS/MINOR/MAJOR レビューで妥当性検証する。"pwn request" パターン非該当の根拠と、fork PR シナリオでの secrets / token 露出ゼロを review.md に記録する。

## 実行タスク

- 代替案 4 案を `outputs/phase-3/review.md` に列挙し、PASS/MINOR/MAJOR で評価する：
  - **A**：`pull_request_target` を残しつつ PR head を checkout（**MAJOR**：pwn request の典型パターン、却下）。
  - **B**：`pull_request_target` を完全廃止（**MINOR**：triage 機能（label / auto-merge）が GITHUB_TOKEN を必要とするケースで運用負荷増、却下）。
  - **C**：`pull_request_target` を triage 専用に限定し、build/test を `pull_request` に分離（**PASS**、base case として採択）。
  - **D**：C + `workflow_run` 経由で secrets を fork build に橋渡し（**MAJOR**：橋渡しが新たな pwn surface、却下）。
- 著上の base case（C 案）に対して NO-GO 条件を 3 つ記述する：(N-1)親タスク未完了で safety gate 草案が input に取れない、(N-2)UT-GOV-001 未適用で required status checks 名が job と未同期、(N-3)UT-GOV-007 未適用で `uses:` が SHA pin されていない。
- "pwn request" 非該当のレビュー記録を 5 箇条で残す（Phase 2 設計の 5 箇条と対応）。各箇条について「現状」「設計後」「検証手段（Phase 9 での再確認）」を 3 列で表化する。
- security review 観点を列挙：(S-1)secrets 棚卸し（どの secret を triage が触るか）、(S-2)GITHUB_TOKEN scope の最小化、(S-3)`actions: write` 権限の有無監査、(S-4)外部 action（Marketplace）の SHA pin、(S-5)`pull_request_target` workflow が触る label / branch / file の allowlist。
- ロールバック設計のレビュー：単一 revert コミットで safety gate 導入前へ戻せるか・required status checks 名がドリフトしないかを確認。
- 用語整合チェック：Phase 1 で固定した canonical（`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern`）が design.md / review.md で表記揺れなく使われているか。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-3/review.md`
- `https://securitylab.github.com/research/github-actions-preventing-pwn-requests/`

## 成果物

- `outputs/phase-3/main.md`
- `outputs/phase-3/review.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。review.md には Phase 9 で再検証する観点を入口として記述する。

## 完了条件

- [ ] 代替案 4 案が PASS/MINOR/MAJOR で評価され、base case（C 案）が PASS で採択されている。
- [ ] NO-GO 条件 N-1〜N-3 が記述されている。
- [ ] "pwn request" 非該当の 5 箇条がレビュー記録として残っている。
- [ ] security review 観点 S-1〜S-5 が列挙されている。
- [ ] 用語整合チェック結果が記録されている。
- [ ] artifacts.json の Phase 3 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
