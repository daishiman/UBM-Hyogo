# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | pending |

## 目的

AC-1〜AC-5 の全受入条件に対して検証項目が完全にトレースされていることを確認し、漏れがある場合は補完する。docs-only タスクとして設定内容の記録・参照が確実に行われていることを担保する。

## 実行タスク

- AC matrix を作成し AC-1〜AC-5 を全トレースする
- 各 AC に対応する検証項目と証跡の所在を明確化する
- 未カバーの検証項目を洗い出し、対応 Phase を割り当てる
- 02-serial-monorepo-runtime-foundation の AC との整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順・wrangler 操作 |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md | AC 定義の正本 |
| 必須 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | 組み込み先 AC との整合確認 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: AC matrix の作成

- index.md の AC-1〜AC-5 を再読する
- 各 AC に対応する検証項目を列挙する
- 各検証項目の証跡パスと担当 Phase を特定する

### ステップ 2: 検証項目の網羅性確認

- AC matrix を完成させる
- 証跡が存在しない AC を特定する
- 不足している証跡の作成を後続 Phase に割り当てる

### ステップ 3: 整合性の確認と handoff

- 02-serial-monorepo-runtime-foundation の AC と本タスクの AC の整合を確認する
- Phase 10 の GO/NO-GO 判定で使用する AC トレース結果を outputs に保存する
- 次 Phase (Phase 8) に渡す open question を記録する

## AC matrix（AC-1〜AC-5 全トレース）【必須】

| AC | 内容 | 検証項目 | 証跡パス | 担当 Phase | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | wrangler.toml に D1 バインディングが定義され、WAL mode の設定根拠がコメントで記載されている | wrangler.toml の [[d1_databases]] 定義確認 / WAL mode コメント存在確認 | outputs/phase-02/wal-mode-design.md | Phase 2 / Phase 5 | pending |
| AC-2 | staging / production D1 に対して `PRAGMA journal_mode=WAL` が適用されていることが確認できる | `wrangler d1 execute` の実行結果ログ確認 | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md | Phase 5 | pending |
| AC-3 | WAL mode 設定手順が 02-serial-monorepo-runtime-foundation の runbook に記録されている | runbook 内 WAL mode セクションの存在確認 | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md | Phase 5 / Phase 12 | pending |
| AC-4 | ローカル開発環境との WAL mode 差異が文書化されている | env-diff-matrix.md の存在と local / staging / production 比較の記載確認 | outputs/phase-02/env-diff-matrix.md | Phase 2 | pending |
| AC-5 | 02-serial-monorepo-runtime-foundation の AC との整合が確認されている | 02-serial-monorepo-runtime-foundation/index.md の AC と本タスク AC の対応表確認 | outputs/phase-07/ac-matrix.md | Phase 7 | pending |

## 02-serial-monorepo-runtime-foundation AC 整合確認

| 本タスク AC | 整合先 AC (02-serial) | 整合内容 | 状態 |
| --- | --- | --- | --- |
| AC-1 | D1 バインディング設定 AC | wrangler.toml の D1 設定が同一定義であること | pending |
| AC-2 | staging/production デプロイ AC | PRAGMA 実行が 02-serial の deploy 手順に含まれること | pending |
| AC-3 | runbook 更新 AC | 02-serial の runbook が WAL mode セクションを含むこと | pending |
| AC-4 | 環境差異文書化 AC | local/staging/production の差異が 02-serial の設計と矛盾しないこと | pending |
| AC-5 | - | 本 Phase で確認完了 | pending |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1〜6 | 各 Phase の成果物が AC の証跡として機能しているか確認 |
| Phase 10 | AC matrix を GO/NO-GO 判定の根拠として使用 |
| Phase 12 | close-out 時の spec sync において AC 完了状態を参照 |

## 多角的チェック観点（AIが判断）

- 価値性: 全 AC に検証項目が割り当てられ、証跡の場所が明確か。
- 実現性: docs-only タスクとして証跡がドキュメントで代替されているか。
- 整合性: 02-serial-monorepo-runtime-foundation の AC と矛盾なく整合しているか。
- 運用性: Phase 10 の GO/NO-GO 判定が AC matrix のみで判断できるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 作成 | 7 | pending | outputs/phase-07/ac-matrix.md |
| 2 | 不足証跡の特定 | 7 | pending | 後続 Phase に割り当て |
| 3 | 02-serial との整合確認 | 7 | pending | index.md 参照 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜AC-5 の全トレース表 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- AC-1〜AC-5 の全行に検証項目・証跡パス・担当 Phase が記載されている
- 証跡が存在しない AC が後続 Phase に割り当て済みである
- 02-serial-monorepo-runtime-foundation との整合が確認されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (設定 DRY 化)
- 引き継ぎ事項: AC matrix の完成状態と不足証跡の一覧を Phase 8 に引き継ぐ。
- ブロック条件: AC matrix が未作成なら次 Phase に進まない。
