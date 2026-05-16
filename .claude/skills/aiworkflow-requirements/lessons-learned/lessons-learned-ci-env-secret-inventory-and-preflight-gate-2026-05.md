# Lessons Learned — CI Env Secret Inventory and Preflight Gate（2026-05-16）

> task: `ci-env-secret-inventory-and-preflight-gate`
> 関連 spec: `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-{1..3}.md`、`docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/outputs/phase-{1,2,3,11,12}/`
> 関連 source: `scripts/ci/verify-env-secrets.sh`、`scripts/ci/__tests__/verify-env-secrets.spec.sh`、`scripts/ci/verify-env-secrets.allowlist`、`.github/workflows/verify-env-secrets.yml`、`.github/workflows/d1-migration-verify.yml`、`docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-01-staging-runtime-smoke-secret-finalization/runbook.md`、`docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-02-adjacent-unregistered-secret-inventory/inventory.md`
> 関連 reference: `references/deployment-secrets-management.md`、`references/deployment-gha.md`、`references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`SKILL-changelog.md`

## 教訓一覧

### L-CI-ENV-001: allowlist は短期 mute 専用とし、pending business secret は既定登録禁止

- **背景**: `scripts/ci/verify-env-secrets.allowlist` を整備した際、未プロビジョン状態の業務 secret（例: `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`）を allowlist に初期登録してしまうと、preflight gate が「将来も常に通る」状態に固定化され、provisioning 漏れの検知装置が壊れる。
- **教訓**: allowlist は **短期 mute（外部要因で投入不可・除外条件を明記）専用** とし、`reason` フィールド必須・除外日付の運用を SSOT の `references/deployment-secrets-management.md` 側で明文化する。pending business secret は allowlist ではなく task-02 inventory に「provision 待ち」として記録する。
- **将来アクション**: 新規 CI gate を追加するときは allowlist の運用境界（短期 mute vs business pending）を README/runbook 冒頭に明示し、grep gate で `reason:` キー必須を保証する。

### L-CI-ENV-002: secret lifecycle は `provision / align / retire` の 3 phase で分け、同一 wave で混ぜない

- **背景**: 当初は task-01 (staging runtime smoke の secret finalization) と task-02 (adjacent unregistered secret inventory) と task-03 (preflight gate 実装) を 1 task に統合する案もあったが、provisioning（人手の secret 投入）と alignment（既存 workflow 内の参照名修正：`d1-migration-verify.yml`）と inventory/gate（読み取り専用検査）は責任境界とリスクが異なる。
- **教訓**: secret lifecycle 操作は **provision / align / retire** に 3 分離し、provision は user-gated runtime、align は workflow YAML 修正で AI 可、retire は読み取り inventory + 人間判断 の責任分担を runbook に明示する。同一 wave で混ぜると runtime gate 失敗時の rollback 単位が不明瞭になる。
- **将来アクション**: secret 関連の新規 workflow を起票する際、index.md の「scope 分離」セクションに 3 phase 表を必ず置き、tasks ディレクトリ命名で phase を区別する（本 task の `task-01-*` / `task-02-*` / `task-03-*` 構成が雛形）。

### L-CI-ENV-003: verify-env-secrets は secret name のみを扱い value は一切 grep しない契約

- **背景**: preflight gate は workflows 内の `secrets.NAME` 参照を抽出し `gh api` で env/repo の secret name 一覧と照合するが、ここで secret 値（masked log の `***` を含む）に触れると CI ログに値断片が漏れる事故面が生まれる。
- **教訓**: `scripts/ci/verify-env-secrets.sh` の入出力は **secret name の集合演算のみ**（参照名 ∖ プロビジョン済み名 ∖ allowlist）とし、`gh secret list --json name` 以外の API を呼ばない契約を inline コメントと runbook で固定。test fixture も name list のみで構成し、value を含むモック禁止。
- **将来アクション**: 今後の secret 関連 helper には冒頭に `# CONTRACT: name-only` のような契約コメントを置き、PR review で value 取得 API（`gh secret get` など）の追加を block する。

### L-CI-ENV-004: 3-state vocabulary `implemented_local_evidence_captured / runtime_pending / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を artifacts.json に固定

- **背景**: 当初の Phase 12 close-out で「PASS」単独を verdict に使おうとしたが、secret placement / variable mutation / workflow rerun / commit / push / PR がすべて user-gated runtime であり、AI 側の judgement では `PASS` を主張できない（runtime evidence は未取得）。
- **教訓**: ローカル static 完了 + runtime 未完を表す verdict は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`、`metadata.workflow_state` は `implemented_local_evidence_captured`、`artifacts.json.status` は `runtime_pending` の 3-state を 1 セットで使う。これは `ci-runtime-smoke-staging-secrets-recovery` で確立した語彙を踏襲し、root と outputs の artifacts.json で完全に揃える。
- **将来アクション**: non-visual / runtime-dependent workflow の Phase 12 では state-vocab 検証 step を必ず入れ、`PASS` 単独を使った verdict は CI gate `verify-phase12-compliance` 相当でブロックする運用に寄せる。

### L-CI-ENV-005: 同一 wave で同期する `5 runtime smoke secrets` と `15 隣接 workflow refs` の境界を明示分離する

- **背景**: task-01 が扱う「staging runtime smoke 本体必須 5 secrets」と、task-02 が扱う「隣接 workflow が参照する 15 種の secret refs（含 pending）」は、最初は「全部まとめて inventory」しがちだが、実際には前者は runtime 投入待ち・後者は静的 catalog で性質が異なる。
- **教訓**: secret inventory の SSOT は **静的 catalog（15 refs / canonical count）** と **runtime placement readiness（5 secrets）** を明確に分離して保持する。`task-02-*/inventory.md` は前者、`task-01-*/runbook.md` は後者を担当し、artifacts.json でも参照を分離する。
- **将来アクション**: 「N 種以上」のような曖昧な count 表記は禁止し、`canonical 15 refs` / `runtime placement 5 secrets` のように **数値 + scope** を必ず併記する SSOT 整形ルールを quick-reference に明文化する。

## 同期した正本

| 種別 | パス | 反映内容 |
| --- | --- | --- |
| Index | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | canonical 15 refs / 3-state vocab / preflight gate を `2026-05-16` 行に同期 |
| Index | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | scope / implementation / inventory / runbook / evidence / user gate を列挙 |
| Reference | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | preflight gate / 3-state vocab / user-gated runtime を正本化 |
| Reference | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | allowlist 短期 mute 専用性・name-only contract・5/15 境界を明記 |
| Reference | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | `d1-migration-verify.yml` staging secret alignment / verify-env-secrets workflow を反映 |
| Changelog | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | `v2026.05.16-ci-env-secret-inventory-and-preflight-gate` |

## 境界 / user gate

- AI 実行可: workflow YAML 修正 (`d1-migration-verify.yml` staging secret alignment)、script 追加 (`verify-env-secrets.sh`)、test fixture、runbook / inventory ドキュメント、aiworkflow-requirements 同期
- User-gated runtime: `gh secret set` (secret placement)、`gh variable set`、`gh workflow run`、commit、push、PR creation、GitHub Actions runtime rerun
- 禁止: secret value の log / doc / context への記録、`gh secret get` 等の value 取得 API 呼び出し、allowlist への pending business secret 既定登録
