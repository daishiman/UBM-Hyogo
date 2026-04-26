# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR作成) |
| 状態 | spec_created |

## 目的

本タスク（UT-02）の成果物を 02-serial-monorepo-runtime-foundation の runbook に統合し、正本仕様（system spec）へ D1 PRAGMA 制約を反映する。close-out として未割り当てタスクの検出とスキルフィードバックを行い、Phase 12 タスク仕様遵守チェックを実施する。

## 実行タスク

- 02-serial-monorepo-runtime-foundation の runbook に WAL mode セクションを統合する
- system-spec-update-summary を作成する
- documentation-changelog を記録する
- unassigned-task-detection を実施する
- skill-feedback-report を作成する
- phase12-task-spec-compliance-check を実施する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
| 必須 | docs/ut-02-d1-wal-mode/outputs/phase-05/foundation-bootstrap-runbook-wal-section.md | runbook 統合元コンテンツ |
| 必須 | docs/completed-tasks/02-serial-monorepo-runtime-foundation/index.md | 統合先ドキュメント |
| 必須 | docs/ut-02-d1-wal-mode/index.md | タスク正本 |
| 参考 | docs/ut-02-d1-wal-mode/outputs/phase-07/ac-matrix.md | AC 完了証跡 |

## 実行手順

### ステップ 1: runbook 統合

- 02-serial-monorepo-runtime-foundation の runbook に WAL mode セクションを追加する
- WAL mode 設定コマンド・確認手順・環境差異の要約を統合する
- 統合後の runbook が AC-3 を満たすことを確認する

### ステップ 2: system-spec-update-summary の作成

- 本タスクで変更・追加された設計知識を要約する
- 影響を受けた正本仕様ファイルを列挙する
- 次 wave のタスクに引き継ぐべき設計決定を記録する

### ステップ 3: close-out タスクの実施

- documentation-changelog に本タスクの変更履歴を記録する
- unassigned-task-detection で未割り当てタスクを洗い出す
- skill-feedback-report で本タスクで判明したスキル改善点を記録する
- phase12-task-spec-compliance-check で仕様遵守を確認する

## implementation-guide【必須】

本タスクは **docs-only** であるため、コード実装は対象外。
下記は WAL mode 設定を実際に適用する際の実装ガイドとして記録する（02-serial Phase 5 で使用する）。

### wrangler.toml D1 バインディング設定例

```toml
# D1 write/read contention policy:
# Do not assume persistent PRAGMA journal_mode=WAL unless Cloudflare D1
# documents support for it. Runtime mitigation is handled in UT-09.
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-local"
database_id = "local-dummy-id"

[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-staging"
database_id = "<staging-database-id>"  # Cloudflare Dashboard から取得

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-production"
database_id = "<production-database-id>"  # Cloudflare Dashboard から取得
```

### WAL mode 適用コマンド

```bash
# staging の現在値を読み取り確認
wrangler d1 execute ubm-hyogo-staging --env staging \
  --command "PRAGMA journal_mode;"
# 結果を evidence として記録する。wal を期待値として固定しない。
```

## system-spec-update-summary【必須】

| 更新対象 | 変更内容 | 影響範囲 |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation runbook | D1 競合対策の条件付き確認セクションを追加 | 02-serial Phase 5 実行者 |
| deployment-cloudflare.md | D1 PRAGMA は official compatible list を確認し、`journal_mode` を TOML や未確認 mutation で前提化しない制約を追加 | UT-04 / UT-09 実装者 |
| 環境差異マトリクス | local / staging / production の WAL mode 差異を記録 | ローカル開発者 |

## documentation-changelog【必須】

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-26 | 新規作成 | docs/ut-02-d1-wal-mode/ | UT-02 タスク仕様書全体 |
| 2026-04-26 | 記録済み | 02-serial-monorepo-runtime-foundation runbook | D1 競合対策の条件付き確認セクション統合 |
| 2026-04-26 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 PRAGMA / journal_mode 制約を追加 |
| 2026-04-26 | 記録済み | outputs/phase-12/system-spec-update-summary.md | spec update summary 作成 |

## unassigned-task-detection【必須】

| 検出項目 | 種別 | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- |
| staging / production D1 の PRAGMA 実行可否確認 | 実作業 | 02-serial Phase 5 で公式永続サポートを確認し、承認がある場合のみ staging から検証 | 02-serial-monorepo-runtime-foundation |
| WAL mode 動作検証（同時読み書き） | 実作業 | Sheets→D1 同期実装時に検証 | UT-09 |
| D1 スキーマ設計と WAL mode の相互影響確認 | 設計 | D1 スキーマ設計フェーズで考慮 | UT-04 |
| wrangler.toml の database_id 実値の管理 | 運用 | Cloudflare Dashboard で管理・1Password に正本を保管 | 運用担当 |

## skill-feedback-report【必須】

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | docs-only タスクの N/A 処理が Phase 11 に集約されており適切 | Phase 12 の実装ガイドと N/A テーブルの連携をテンプレートに追加する |
| aiworkflow-requirements | deployment-cloudflare.md に wrangler.toml での PRAGMA 直接指定不可と compatible PRAGMA 確認ルールが必要 | D1 PRAGMA 制約セクションを追加済み |

## phase12-task-spec-compliance-check【必須】

| チェック項目 | 基準 | 状態 |
| --- | --- | --- |
| implementation-guide が作成されている | docs-only は実装ガイドを Phase 12 に記録する | PASS |
| system-spec-update-summary が作成されている | 影響を受けた正本仕様が列挙されている | PASS |
| documentation-changelog が記録されている | 全変更ファイルが記録されている | PASS |
| unassigned-task-detection が実施されている | 未割り当てタスクが洗い出されている | PASS |
| skill-feedback-report が作成されている | スキル改善提案が記録されている | PASS |
| same-wave sync ルールが守られている | spec-update-workflow.md の同期ルールに従っている | PASS |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook 統合の参照元として使用 |
| Phase 11 | smoke test N/A 情報を close-out に記録 |
| Phase 13 | PR 作成のための成果物一覧を提供 |

## 多角的チェック観点（AIが判断）

- 価値性: runbook 統合により 02-serial Phase 5 実行者が WAL mode 設定を見落とさないか。
- 実現性: docs-only 範囲で system spec update が完結しているか。
- 整合性: documentation-changelog が全変更ファイルを網羅しているか。
- 運用性: unassigned-task-detection で後続タスクへの引き継ぎが漏れていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 統合 | 12 | spec_created | 02-serial runbook に WAL mode セクション追加 |
| 2 | system-spec-update-summary 作成 | 12 | spec_created | outputs/phase-12/system-spec-update-summary.md |
| 3 | documentation-changelog 記録 | 12 | spec_created | 全変更ファイルを列挙 |
| 4 | unassigned-task-detection | 12 | spec_created | 未割り当てタスクを洗い出し |
| 5 | skill-feedback-report 作成 | 12 | spec_created | スキル改善提案 |
| 6 | phase12-task-spec-compliance-check | 12 | spec_created | 仕様遵守確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec update summary |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割り当てタスク一覧 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | スキルフィードバック |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- [ ] 02-serial-monorepo-runtime-foundation の runbook に WAL mode セクションが統合されている
- system-spec-update-summary が作成されている
- documentation-changelog が記録されている
- unassigned-task-detection が実施されており後続タスクへの委譲が明記されている
- phase12-task-spec-compliance-check の全項目が PASS である

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR作成)
- 引き継ぎ事項: Phase 12 の全成果物一覧・documentation-changelog・変更ファイルリストを Phase 13 に引き継ぐ。
- ブロック条件: phase12-task-spec-compliance-check に未 PASS 項目がある場合は Phase 13 に進まない。
