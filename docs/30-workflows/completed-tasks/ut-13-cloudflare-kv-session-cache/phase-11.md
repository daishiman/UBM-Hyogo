# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare KV セッションキャッシュ設定 (UT-13) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-27 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |

## 目的

docs-only タスクとして、wrangler CLI による KV namespace への手動 put / get 確認手順・TTL 失効確認手順・staging/production 切り替えテスト手順を文書化する。本タスクは UI 変更を伴わない NON_VISUAL タスクのためスクリーンショットは不要。manual evidence として CLI 実行ログ抜粋を記録する設計とする。

> **UI/UX 変更なしのため Phase 11 スクリーンショット不要。**

## 実行タスク

- docs-only タスクの範囲で実施可能な確認項目を特定する
- 実施不可能な smoke test 項目について N/A 理由を明記する
- wrangler kv:key put / get / list / delete コマンドの実行手順を文書化する
- TTL 失効確認手順を文書化する
- staging / production 切り替えテスト手順を文書化する
- manual evidence テーブル（CLI 出力抜粋テンプレート）を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler kv コマンド確認 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md | タスク種別（docs-only / NON_VISUAL）確認 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md | 設定確認コマンドの参照 |

## 実行手順

### ステップ 1: docs-only / NON_VISUAL 範囲の確認

- タスク種別（docs-only / NON_VISUAL）を再確認し、実施対象と非対象を明確にする
- 実施可能な確認項目（CLI 手順の文書確認等）を列挙する
- 実施不可能な項目（実環境への put / get 等）の N/A 理由を記録する

### ステップ 2: 手動 smoke test 手順の文書化

- KV namespace への手動 put / get 手順を記載する
- TTL 失効確認手順（短い TTL で put → 待機 → null 確認）を記載する
- staging / production 切り替えテスト手順を記載する

### ステップ 3: manual evidence テーブルの作成

- 各 smoke test 項目について実施可否・N/A 理由・代替手段を記録する
- CLI 実行ログ抜粋を保存するためのテンプレートを準備する

## 手動 smoke test コマンド手順【必須】

### 1. KV Namespace への put / get 確認

```bash
# staging に put（binding 名で指定 / wrangler が namespace ID を解決）
wrangler kv:key put --binding=SESSION_KV --env=staging \
  "test-key" "test-value"

# get で確認
wrangler kv:key get --binding=SESSION_KV --env=staging "test-key"
# 期待出力: test-value

# list でキー一覧確認
wrangler kv:key list --binding=SESSION_KV --env=staging

# クリーンアップ
wrangler kv:key delete --binding=SESSION_KV --env=staging "test-key"
```

### 2. TTL 失効確認

```bash
# 短い TTL（60 秒）で put（運用上の検証値。Cloudflare KV cacheTtl の最小値とは別）
wrangler kv:key put --binding=SESSION_KV --env=staging \
  --ttl=60 "ttl-test" "expires-soon"

# 即座に get（取得できる）
wrangler kv:key get --binding=SESSION_KV --env=staging "ttl-test"

# 60 秒以上待機（KV 最終的一貫性のため余裕を持って 90 秒推奨）
sleep 90

# 再度 get（null / Not Found を期待）
wrangler kv:key get --binding=SESSION_KV --env=staging "ttl-test"
# 期待: Key "ttl-test" not found
```

### 3. staging / production 切り替えレビュー

```bash
# staging への put
wrangler kv:key put --binding=SESSION_KV --env=staging "env-check" "staging-value"

# staging で get し、値が書けること確認
wrangler kv:key get --binding=SESSION_KV --env=staging "env-check"
# 期待: staging-value

# production は本番書き込みを避け、Namespace と binding の存在確認に留める
wrangler kv:namespace list | grep "ubm-hyogo-kv-prod"
grep -A3 "env.production.kv_namespaces" apps/api/wrangler.toml

# クリーンアップ
wrangler kv:key delete --binding=SESSION_KV --env=staging "env-check"
```

## manual evidence（NON_VISUAL タスク向け CLI 出力テンプレート）【必須】

| smoke test 項目 | 実施区分 | N/A 理由 / 代替手段 | 代替証跡パス |
| --- | --- | --- | --- |
| staging KV への put / get 確認 | 実施可（CLI 出力を記録） | 実環境への CLI 実行はインフラ担当が実施し CLI 出力抜粋を保存 | outputs/phase-11/cli-evidence-staging.txt |
| production KV への put / get 確認 | 原則 N/A | LOW priority docs-only タスクでは本番書き込みを避け、namespace / binding 存在確認レビューに留める | outputs/phase-11/production-review-evidence.md |
| TTL 失効確認（60 秒待機） | 実施可（staging のみ） | staging で 60 秒 TTL put → 90 秒 sleep → not found 確認 | outputs/phase-11/cli-evidence-ttl.txt |
| staging / production 切り替えテスト | staging 実施 + production レビュー | binding 同一で env オプションを切り替える手順を確認し、本番書き込みは避ける | outputs/phase-11/cli-evidence-env-switch.txt |
| Workers からの read/write 動作確認（コード経由） | N/A | docs-only タスクのため Worker 実装は対象外。実装は下流タスクで実施 | docs/30-workflows/ut-13-cloudflare-kv-session-cache/index.md（スコープ外明記）|
| 同時アクセス時の最終的一貫性検証 | N/A | 本タスクはドキュメント記録のみ。動作検証はセッション管理実装タスクで実施 | outputs/phase-09/quality-report.md（最終的一貫性指針記録済み）|
| UI スクリーンショット | N/A | NON_VISUAL タスク（UI/UX 変更なし）のため不要 | - |
| wrangler.toml の KV バインディング定義をコードレビューで確認 | 実施可 | docs-only の範囲内で設計ドキュメントとの整合をレビューする | outputs/phase-08/dry-config-policy.md |
| AC-1〜AC-7 の証跡ドキュメントが揃っているか確認 | 実施可 | Phase 7 の AC matrix と証跡パスを照合する | outputs/phase-07/ac-matrix.md |

## docs-only / NON_VISUAL タスク smoke test 方針

本タスクはタスク種別が **docs-only / NON_VISUAL** であるため、以下の方針を適用する。

1. **UI スクリーンショットはすべて N/A** とする（NON_VISUAL のため UI 変更なし）
2. **CLI 実行ログ（put / get / TTL 失効）は実施可** とし、抜粋を `outputs/phase-11/cli-evidence-*.txt` に保存することをもって証跡とする
3. **Worker コード経由の動作検証は下流タスクへ委譲** し、本タスクでは CLI レベルの確認に留める
4. **本番環境での test-key 操作は原則実施しない**。必要な場合は別途承認を取り、実施後は必ず delete でクリーンアップする

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の設定確認コマンドを smoke test 手順として再利用 |
| Phase 12 | smoke test 結果（manual evidence テーブル / CLI 出力抜粋）を close-out ドキュメントに記録 |

## 多角的チェック観点（AIが判断）

- 価値性: smoke test 手順が下流タスク・運用フェーズで再現可能か。
- 実現性: docs-only 範囲の確認項目が漏れなく実施されているか。
- 整合性: N/A の代替証跡が Phase 1〜10 の成果物と一致しているか。
- 運用性: 本番環境への test-key 残存を防ぐクリーンアップ手順が記録されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 手動 smoke test コマンド手順文書化 | 11 | completed | put / get / TTL / env 切替 |
| 2 | manual evidence テーブル作成 | 11 | completed | CLI 出力テンプレート |
| 3 | ドキュメントレビュー（整合確認） | 11 | completed | AC matrix・runbook の照合 |
| 4 | smoke test 結果記録 | 11 | completed | outputs/phase-11/smoke-test-result.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/smoke-test-result.md | manual evidence テーブルと smoke test 手順 |
| ログ | outputs/phase-11/cli-evidence-staging.txt | staging put/get の CLI 出力抜粋（実施時） |
| ログ | outputs/phase-11/cli-evidence-production.txt | production put/get の CLI 出力抜粋（実施時） |
| ログ | outputs/phase-11/cli-evidence-ttl.txt | TTL 失効確認の CLI 出力抜粋（実施時） |
| ログ | outputs/phase-11/cli-evidence-env-switch.txt | staging/production 切り替えテストの CLI 出力抜粋（実施時） |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- 手動 smoke test コマンド手順が文書化されている
- manual evidence テーブルの全項目に実施区分・N/A 理由・代替証跡が記録されている
- NON_VISUAL のためスクリーンショット不要が明記されている
- 実施不可項目の委譲先（下流タスク）が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke test 結果（manual evidence テーブル / CLI 出力抜粋）と委譲先情報を Phase 12 に引き継ぐ。
- ブロック条件: docs-only 範囲の確認項目が未完了の場合は Phase 12 に進まない。
