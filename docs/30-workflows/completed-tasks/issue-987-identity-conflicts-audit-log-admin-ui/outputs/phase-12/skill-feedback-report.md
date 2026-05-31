# Skill Feedback Report（Issue #987 dismiss 監査ログ対称化）

task-specification-creator / aiworkflow-requirements skill への改善提案と lessons。改善点なしの観点も「該当なし」として記録する。

## テンプレート改善

| 観点 | 提案 / 結果 |
| --- | --- |
| Phase 12 strict 7 テンプレート | 改善提案なし（canonical 9 headings + strict 7 構成は本タスクにそのまま適用できた） |
| NON_VISUAL の Phase 11 代替証跡 | 改善提案なし。`UI/UX変更なしのため Phase 11 スクリーンショット不要` + vitest contract 参照の定型が機能した |

## ワークフロー改善

| 観点 | 提案 / 結果 |
| --- | --- |
| CLOSED issue の最新コード照合 | lessons として記録（下記 L-I987-001）。CLOSED issue を旧前提のまま仕様化せず、最新コードに照合して根本問題を最小単位へ最適化してから仕様化するフローを定着させたい |
| 対称操作の片側欠落検出 | lessons として記録（下記 L-I987-002）。merge/dismiss のような対称操作で片側だけ監査記録が欠落するアンチパターンの検出手順を体系化したい |

## ドキュメント改善

| 観点 | 提案 / 結果 |
| --- | --- |
| audit action 語彙の SSOT | lessons として記録（下記 L-I987-003）。新 audit action 値を追加する際、`audit_log.action` 語彙の正本一覧をどの spec に置くか曖昧。語彙一覧の SSOT 化を提案 |

## Lessons

### L-I987-001: CLOSED issue は最新コードに照合し根本問題を 1 点に最適化してから仕様化する

- 背景: Issue #987 は「merge / dismiss 両方とも UI から見られない」という旧前提で書かれていたが、最新コードでは merge は既に `audit_log` → `/admin/audit` で閲覧可能だった。
- 教訓: CLOSED issue を仕様化する際は、Issue 本文をそのまま信じず、現行コードを grep で照合（`grep -rn "identity.merge\|identity.dismiss"` / `audit_log` INSERT 箇所）し、未解決の根本問題を最小単位（本件は「dismiss が監査ログに残らない一点」）へ最適化してから Phase 1 を起こす。
- 手順: (1) Issue の主張を箇条書き化 → (2) 各主張を実コードで検証（解決済み/未解決を表に） → (3) 未解決のみをスコープに据える → (4) Issue は CLOSED のまま参照（再 OPEN しない）。

### L-I987-002: 対称操作の片側だけ監査記録が欠落するアンチパターンの検出

- 背景: merge は D1 batch で `audit_log` に記録していたが、dismiss は `identity_conflict_dismissals` への単一 INSERT のみで `audit_log` 未記録だった。
- 教訓: 「同じドメインの対称操作（apply/revert、merge/dismiss、grant/revoke など）」は監査記録の有無を必ず対で確認する。
- 検出手順: (1) 対称操作のペアを特定 → (2) 各 repository 関数で `audit_log` INSERT の有無を grep → (3) 片側のみ記録なら欠落側を特定 → (4) 記録ありの側の列順・brand 付与・before/after_json 形式を SSOT としてコピーし対称化（独自実装しない）。

### L-I987-003: 新 audit action 値追加時は brand + 列順を既存記録からコピーする

- 背景: `identity.dismiss` を新規追加するにあたり、`AuditAction` brand 付与・`audit_log` 9 列の列順・`AdminId`/`AdminEmail | null` cast を merge 実装（`identity-merge.ts`）からそのまま踏襲した。
- 教訓: audit action を増やすときは既存の正しい INSERT 文を 1 件 SSOT として選び、列順・brand・JSON 形状を逐語コピーしてから値だけ差し替える。独自に組み立てると列順ズレ・brand 漏れの温床になる。

## 総括

本タスクで skill テンプレート自体の不足は検出されなかった（strict 7 / canonical 9 headings / NON_VISUAL 代替証跡は十分に機能）。上記 3 lessons は本サイクルで aiworkflow-requirements の workflow / API 契約同期に反映済み。task-specification-creator 側は既存の same-wave implementation / Phase 12 sync / D1 lane command lesson で吸収できるため no-op とする。
