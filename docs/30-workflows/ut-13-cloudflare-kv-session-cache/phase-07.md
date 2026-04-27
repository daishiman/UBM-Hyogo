# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-27 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | completed |

## 目的

AC-1〜AC-7 の全受入条件に対して検証項目が完全にトレースされていることを確認し、Phase 4 / 5 / 6 のいずれかで証跡が確保されていることを担保する。未網羅 AC があれば該当 Phase に差し戻す判定基準を明確化する。

## 実行タスク

- AC matrix を作成し AC-1〜AC-7 を全トレースする
- 各 AC に対応する検証項目・証跡パス・担当 Phase を明確化する
- 未カバー AC がある場合は差し戻し判定基準に従い該当 Phase に戻す
- 下流タスク（セッション実装・レートリミット実装）への handoff 事項を記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | KV 基本手順・wrangler 操作 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | AC 定義の正本 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-02.md | TTL 方針・無料枠運用方針・最終的一貫性指針の証跡所在 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-04.md | verify suite 結果 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-05.md | runbook / 動作確認結果 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/phase-06.md | failure cases / AC 最終確認 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: AC matrix の作成

- index.md の AC-1〜AC-7 を再読する
- 各 AC に対応する検証項目を列挙する
- 各検証項目の証跡パスと担当 Phase を特定する

### ステップ 2: 検証項目の網羅性確認

- AC matrix を完成させる
- 証跡が存在しない AC を特定する
- 不足している証跡があれば下記「差し戻し判定基準」に従い該当 Phase に差し戻す

### ステップ 3: handoff の整理

- 下流タスク（Auth.js セッション実装・レートリミット実装・設定キャッシュ実装）に渡す情報をまとめる
- バインディング名（`SESSION_KV`）・TTL 方針・無料枠制約・最終的一貫性指針を handoff ドキュメントに記録する
- Phase 10 の GO/NO-GO 判定で使用する AC トレース結果を outputs に保存する

## AC matrix（AC-1〜AC-7 全トレース）【必須】

| AC | 内容 | 検証項目 | 証跡パス | 担当 Phase | 状態 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | KV Namespace 作成手順・命名規約（prod/staging） | `wrangler kv:namespace list` による両環境 Namespace 確認手順 | outputs/phase-05/kv-bootstrap-runbook.md | Phase 5 | completed |
| AC-2 | wrangler.toml バインディング設計 | `[[env.production.kv_namespaces]]` / `[[env.staging.kv_namespaces]]` の設計確認 | outputs/phase-05/kv-bootstrap-runbook.md / apps/api/wrangler.toml | Phase 5 | completed |
| AC-3 | Workers からの read/write 動作確認 | `SESSION_KV.put` / `SESSION_KV.get` 成功ログ確認 | outputs/phase-05/read-write-verification.md | Phase 5 | completed |
| AC-4 | TTL 設定方針ドキュメント化 | 用途別 TTL 表（セッション / 設定キャッシュ / レートリミット）の存在確認 | outputs/phase-02/ttl-policy.md | Phase 2 / Phase 7 | completed |
| AC-5 | 無料枠運用方針明文化 | 100k read/day, 1k write/day, 1 GB storage の運用ルール記述確認 | outputs/phase-02/free-tier-policy.md | Phase 2 / Phase 6 | completed |
| AC-6 | Namespace/バインディング名 下流タスク向けドキュメント化 | バインディング名対応表（ID 除く）の存在確認 | outputs/phase-05/kv-binding-mapping.md | Phase 5 | completed |
| AC-7 | 最終的一貫性制約の設計指針明記 | put 直後 read 禁止 / 即時整合性が必要な操作の代替設計指針の記述確認 | outputs/phase-02/eventual-consistency-guideline.md / outputs/phase-06/failure-cases.md (FC-01) | Phase 2 / Phase 6 | completed |

## 下流タスク handoff（バインディング名・制約一覧）

| 項目 | 値 / 内容 |
| --- | --- |
| バインディング名 | `SESSION_KV` |
| Namespace 名（production） | `ubm-hyogo-kv-prod` |
| Namespace 名（staging） | `ubm-hyogo-kv-staging` |
| Namespace ID 取得元 | 1Password Environments（リポジトリ非コミット） |
| TTL 方針参照 | outputs/phase-02/ttl-policy.md |
| 無料枠運用方針参照 | outputs/phase-02/free-tier-policy.md |
| 最終的一貫性指針 | put 直後 read 禁止 / 即時整合性が必要な箇所は D1 / Durable Objects を採用 |
| 禁止事項 | セッションごと write / read-after-write 前提の実装 / Namespace ID のコード直書き |

## 差し戻し判定基準

| 状況 | 差し戻し先 | 理由 |
| --- | --- | --- |
| AC-1 / AC-2 の証跡が outputs/phase-05/ に存在しない | Phase 5 | セットアップ未完了 |
| AC-3 の動作確認が記録されていない | Phase 5 | read/write 動作検証未完了 |
| AC-4 の TTL 方針ドキュメントが存在しない | Phase 2 | 設計成果物の欠落 |
| AC-5 の無料枠運用方針が未明文化 | Phase 2 / Phase 6 | 運用方針 / 異常系検証の不足 |
| AC-6 のバインディング対応表に Namespace ID が含まれている | Phase 5 | 機密管理違反 → 即時是正 |
| AC-7 の最終的一貫性指針が未記載 | Phase 2 | 設計指針欠落 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 1〜6 | 各 Phase の成果物が AC の証跡として機能しているか確認 |
| Phase 8 | 設定 DRY 化対象として wrangler.toml の KV バインディング定義を引き継ぐ |
| Phase 10 | AC matrix を GO/NO-GO 判定の根拠として使用 |
| Phase 12 | close-out 時の spec sync において AC 完了状態を参照 |

## 多角的チェック観点（AIが判断）

- 価値性: 全 AC（AC-1〜AC-7）に検証項目が割り当てられ、証跡の場所が明確か
- 実現性: docs-only タスクとして証跡がドキュメントで代替されているか / 動作確認部分は外部証跡（runbook / ログ）で担保されているか
- 整合性: 最終的一貫性 / 無料枠 / 機密管理の三制約が AC matrix と failure cases に矛盾なく反映されているか
- 運用性: Phase 10 の GO/NO-GO 判定が AC matrix のみで判断できるか / 下流タスクが handoff ドキュメントから必要情報を取得可能か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix 作成 | 7 | completed | outputs/phase-07/ac-matrix.md |
| 2 | 不足証跡の特定と差し戻し判定 | 7 | completed | 差し戻し判定基準を適用 |
| 3 | 下流タスク handoff ドキュメント作成 | 7 | completed | outputs/phase-07/handoff.md |
| 4 | 02-serial-monorepo-runtime-foundation との整合確認 | 7 | completed | 該当する場合のみ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜AC-7 の全トレース表 |
| ドキュメント | outputs/phase-07/handoff.md | 下流タスク向けバインディング名・制約 handoff |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- AC-1〜AC-7 の全行に検証項目・証跡パス・担当 Phase が記載されている
- 証跡が存在しない AC が差し戻し判定基準に従い該当 Phase に差し戻されている（または完了確認済み）
- 下流タスク handoff ドキュメントが作成されている
- 機密情報（Namespace ID）が成果物に含まれていないことを確認済み

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（最終的一貫性・無料枠枯渇・Namespace 取り違え）も AC matrix にトレース済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (設定 DRY 化)
- 引き継ぎ事項: AC matrix の完成状態・下流タスク handoff ドキュメント・wrangler.toml の KV バインディング定義を Phase 8 に引き継ぐ
- ブロック条件: AC matrix が未作成 / 機密情報が成果物に含まれている場合は次 Phase に進まない
