# Lessons Learned: Issue #555 audit-correlation salt rotation automation (2026-05)

> task: `issue-555-audit-correlation-salt-rotation-automation`
> workflow root: `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/`
> 関連 spec: `references/audit-correlation.md`, `references/deployment-secrets-management.md`

## 概要

`AUDIT_CORRELATION_SALT` の rotation 自動化と `fingerprintVersion=2` 移行を、既存 `correlate(github, cloudflare)` contract を温存したまま dual-hash bridge で実装したタスク。Phase 11 の runtime staging 証跡は FU-01 live wiring と user approval にブロックされており、Phase 12 は local PASS と SSOT 反映を厳密に揃える形でクローズした。

## 苦戦箇所

### L-555-001: 並行 bridge shape を作らず既存 contract を拡張する判断

- 症状: rotation 移行のために `NormalizedAuditEventBridge` のような並行型を新設したくなる。
- 原因: v1/v2 を別シェイプで保持した方が型シグナル的に明示的に見えた。
- 解決: `CorrelationKey.fingerprintHashes?: { v1?, v2? }` を optional 拡張として既存型に内包し、`correlate()` の public signature は不変にした。並行型を作らなかったことで adapter / call site / test 全層の同期コストを排除。
- 再発防止: 後方互換 rotation を伴う contract 変更では「既存 type の optional 拡張」を第一案、「並行 shape 新設」は最終手段として task spec に明文化する。

### L-555-002: SSOT 分裂を防ぐ secrets policy の集約

- 症状: salt rotation の policy / runbook を `secrets-management.md` として新規分離したくなる。
- 原因: rotation 固有の手順分量が多く、既存 doc の見通しが悪く感じられた。
- 解決: `references/deployment-secrets-management.md` を active SSOT と確定し、`§ Audit correlation salt rotation (Issue #555)` セクションとして同一ファイル内に集約。並行 doc は作らない。
- 再発防止: secret 系 policy は `deployment-secrets-management.md` を SSOT 固定とし、新規 `*-secrets-*.md` を作りそうになったら必ずレビューで catch する（topic-map / resource-map にも単一エントリだけ残す）。

### L-555-003: command contract drift（package placeholder の誤焼き付け）

- 症状: implementation guide / phase spec の `pnpm --filter <pkg> test` が実在しない placeholder package 名で書かれていた。
- 原因: タスク spec 雛形の段階で `apps/api/package.json` を引かずに名前を仮置きしていた。
- 解決: 正本 package 名 `@ubm-hyogo/api` に置換し、`mise exec -- pnpm --filter @ubm-hyogo/api test -- ...` 形式で固定。task-specification-creator v2026.05.08 の command contract drift rule に整合。
- 再発防止: タスク spec を書く時点で `package.json#name` を必ず引き、command 例には placeholder を残さない。Phase 7 acceptance gate で grep する。

### L-555-004: spec_created の状態が implemented-local と乖離する

- 症状: ローカルにコードが既にあるのに workflow registry 上は `spec_created` のままで、実装作業が「未着手」と誤読される。
- 原因: spec 作成時点と local 実装着手のタイミング差を state machine が表現できていなかった。
- 解決: task-specification-creator v2026.05.06 の `implemented-local` 状態語彙と dirty-code gate を Issue #555 にも適用。`spec_created / implementation / NON_VISUAL / CONTRACT_READY_IMPLEMENTATION_PENDING` の 4 軸で記録。
- 再発防止: workflow registry / changelog では「spec / impl / scope / runtime gate」の 4 軸 tuple を必ず明示する。NON_VISUAL タスクでも runtime gate の表記を省略しない。

### L-555-005: Phase 11 が upstream-blocked でも Phase 12 必須成果物は厳密 7 件

- 症状: staging runtime evidence が FU-01 / user approval ブロックなので Phase 12 を「pending」で簡素化したくなる。
- 原因: 「runtime PASS = Phase 12 完了」と誤解しやすい。
- 解決: Phase 12 strict 7 outputs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）+ `indexes-rebuild.log` + `issue-555-state.log` を local 完全配置。compliance state は `PASS_LOCAL_WITH_RUNTIME_PENDING` に固定。
- 再発防止: Phase 12 の必須成果物は upstream block 状況に関係なく揃える。runtime PASS が pending な場合は compliance state 名で明示し、6 必須成果物を 1 件も欠落させない。

### L-555-006: salt 実値 grep gate の運用

- 症状: rotation 自動化 script や docs に salt 値そのものが混入するリスク。
- 原因: rotation 操作の説明と実値表示の境界が曖昧。
- 解決: `scripts/grep-gate/` で salt literal / 1Password 参照 path / Cloudflare Secrets 名以外の露出を検出。runbook / changelog / implementation-guide には常に op:// 参照のみを書き、実値は揮発実行のみ。
- 再発防止: 新規 secret を扱うタスクは grep gate の対象 token に必ず追記し、Phase 11 evidence に grep 0-hit ログを残す。

## 適用範囲

- 後方互換 rotation を伴う API contract 変更（hash bridge / token bridge / signature bridge）
- secret rotation 系タスク全般（`*_PREVIOUS` の dual-resolution パターン）
- Phase 11 が upstream / approval gate でブロックされる NON_VISUAL タスク

## 参考

- `references/audit-correlation.md` § dual-hash bridge contract
- `references/deployment-secrets-management.md` § Audit correlation salt rotation (Issue #555)
- `changelog/20260508-issue555-audit-correlation-salt-rotation.md`
- task-specification-creator v2026.05.06 (`implemented-local` 状態語彙) / v2026.05.08 (command contract drift rule)
