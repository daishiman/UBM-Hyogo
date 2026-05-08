# Lessons Learned: Issue #526 CI actionlint / shellcheck gate (2026-05)

> task: `issue-526-ci-actionlint-shellcheck-gate`
> workflow root: `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/`
> 関連 spec: `references/deployment-gha.md`, `references/post-release-long-term-observation.md`

## 概要

Issue #350 の post-release observation reminder workflow と shell helper を、main へ入る前に CI で壊れないようにする gate。Dedicated job を追加するだけでは branch protection の required context に入らないため、既存 required `ci` context 内にも `pnpm observation:lint` を組み込んだ。

## 苦戦箇所

### L-526-001: dedicated job と required context の効力差

- 症状: `workflow-shell-lint` job を追加しても、branch protection required context に登録されるまでは merge gate として弱い。
- 原因: job の見やすさと required context の強制力を同一視していた。
- 解決: dedicated job は分離証跡として残し、既存 required context `ci` 内でも `pnpm observation:lint` を実行する二段構成にした。
- 再発防止: CI gate を追加する時は「新規 job 名」と「既存 required context 内の実行経路」を別項目で Phase 12 に記録する。

### L-526-002: `secrets.GITHUB_TOKEN` allowlist grep

- 症状: workflow secret hygiene grep を単純な `secrets.*` 禁止にすると、GitHub 標準の `secrets.GITHUB_TOKEN` まで false failure になる。
- 原因: secret literal の存在と、許可済み platform token の区別が grep に入っていなかった。
- 解決: `secrets.GITHUB_TOKEN` は allowlist とし、それ以外の `secrets.*` literal を検出対象にした。
- 再発防止: workflow secret grep は denylist ではなく allowlist + residual grep で設計する。

### L-526-003: local tool availability と CI 再現性

- 症状: ローカルに actionlint / shellcheck が無い環境では、未実行を PASS と誤読しやすい。
- 原因: tool availability と検証結果を Phase 11 evidence で分離していなかった。
- 解決: `pnpm observation:lint` に bash syntax / shell unit / shellcheck / downloaded actionlint を集約し、local reproduction command として正本化した。
- 再発防止: CI lint gate は package script から一発で再現できるようにし、tool download log と実 lint log を evidence として分ける。

### L-526-004: runtime PASS と synced pending の境界

- 症状: `gh run list` で既存 CI run が見えても、新規 job が実際に走った証跡とは限らない。
- 原因: current branch の workflow diff と既存 remote run の時間軸が混ざる。
- 解決: ローカル evidence は PASS、GitHub Actions runtime evidence は PR 後取得として `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に固定した。
- 再発防止: workflow 追加タスクでは `gh run list` を「CI visibility」扱いに留め、新規 job runtime PASS は push / PR 後の `gh run view --log` でのみ確定する。

## 後続タスクへの適用

- actionlint / shellcheck gate は初回対象を Issue #350 追加ファイルに限定する。
- repo 全体 shellcheck 化や汎用 workflow lint gate は既存 backlog と重複させない。
- branch protection PUT は user-gated 外部操作として Phase 13 以降に分離する。

