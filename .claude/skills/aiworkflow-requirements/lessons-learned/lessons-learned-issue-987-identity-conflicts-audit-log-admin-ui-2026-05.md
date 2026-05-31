# Lessons Learned — issue-987-identity-conflicts-audit-log-admin-ui (2026-05)

| 項目      | 値                                                                       |
| --------- | ------------------------------------------------------------------------ |
| Workflow  | `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/` |
| Issue     | #987 CLOSED（PR 文脈は `Refs #987` のみ。再 OPEN しない）                |
| Task type | implementation / NON_VISUAL                                              |
| Phase 状態 | Phase 1-12 completed / Phase 13 pending_user_approval                    |
| 作成日     | 2026-05-29                                                               |

## 背景

Issue #987 は「identity-conflicts の merge / dismiss 両方とも UI から監査履歴を確認できない」という旧前提で書かれていた。だが最新コードでは merge は既に `audit_log` への INSERT → 既存 `/admin/audit` で閲覧可能であり、未解決の根本問題は **dismiss だけが `identity_conflict_dismissals` への単一 INSERT に留まり `audit_log` に記録されない一点** に縮約できた。本サイクルはこの 1 点のみをスコープに据え、`dismissIdentityConflict` に `actorAdminEmail` 引数と `identity.dismiss` の `audit_log` 行を D1 batch で原子的に追記し、対象 member 不在時は 404 (`MEMBER_NOT_FOUND`) を返すよう対称化した。UI は既存 `/admin/audit` をそのまま再利用するため NON_VISUAL。

## Lessons

### L-I987-001: CLOSED issue は最新コードに照合し根本問題を 1 点に最適化してから仕様化する

- **要点**: CLOSED issue を仕様化する際は Issue 本文をそのまま信じず、現行コードを grep 照合（`grep -rn "identity.merge\|identity.dismiss"` / `audit_log` INSERT 箇所）し、未解決の根本問題を最小単位へ最適化してから Phase 1 を起こす。
- **手順**: (1) Issue の主張を箇条書き化 → (2) 各主張を実コードで検証し「解決済み/未解決」を表に → (3) 未解決のみをスコープに据える → (4) Issue は CLOSED のまま参照（再 OPEN しない、`Refs #987` 表記）。
- **反例**: 旧前提のまま「merge / dismiss 両方を実装」とスコープを取ると、既に解決済みの merge 側を重複実装し差分を膨張させる。本件では merge 側は no-op と判定して dismiss 1 点に絞り、最小差分で根本解決した。

### L-I987-002: 対称操作の片側だけ監査記録が欠落するアンチパターンの検出

- **要点**: 同一ドメインの対称操作（apply/revert、merge/dismiss、grant/revoke など）は監査記録の有無を必ず **対で** 確認する。片側のみ `audit_log` 記録だと監査の盲点になる。
- **検出手順**: (1) 対称操作のペアを特定 → (2) 各 repository 関数で `audit_log` INSERT の有無を grep → (3) 片側のみ記録なら欠落側を特定 → (4) 記録ありの側の列順・brand 付与・before/after_json 形式を SSOT としてコピーし対称化（独自実装しない）。
- **適用**: 本件では merge (`identity-merge.ts`) が D1 batch で `audit_log` を記録していたのに dismiss は未記録だった。merge 側を SSOT として列順・brand を踏襲した。

### L-I987-003: 新 audit action 値追加時は brand + 列順を既存記録からコピーする

- **要点**: 新しい `audit_log.action` 値（本件 `identity.dismiss`）を追加するときは、既存の正しい INSERT 文を 1 件 SSOT として選び、`AuditAction` brand 付与・9 列の列順・`AdminId` / `AdminEmail | null` cast・`before_json` / `after_json` の JSON 形状を逐語コピーしてから値だけ差し替える。
- **適用**: dismiss と merge を同じ列順契約に揃えることで `/admin/audit` の action/target フィルタが両方を一様に拾える。dismiss の原子性は `db.batch([dismissalInsert, auditInsert])` で担保し、`batch` 不在時は `DismissAtomicBatchUnavailable` を throw して silent 部分書き込みを防ぐ。
- **反例**: 独自に INSERT を組み立てると列順ズレ・brand 漏れ・atomicity 欠落（dismissal だけ書けて audit が書けない）の温床になる。

## 参照

- [[workflow-issue-987-identity-conflicts-audit-log-admin-ui-artifact-inventory]] (L-I987-001..003)
- [[lessons-learned-issue-976-admin-fetch-service-binding-2026-05]] (public/admin transport symmetry / 対称化の先例)
- skill-feedback-report: `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/skill-feedback-report.md`
- task-specification-creator 側は既存 same-wave implementation / Phase 12 sync / D1 lane command lesson で吸収できるため no-op
