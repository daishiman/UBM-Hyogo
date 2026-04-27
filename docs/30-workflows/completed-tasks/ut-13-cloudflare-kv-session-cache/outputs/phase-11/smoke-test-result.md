# Phase 11: 手動 smoke test 結果（NON_VISUAL）

## タスク種別

- **docs-only / NON_VISUAL**
- **UI/UX 変更なしのため Phase 11 スクリーンショット不要**
- CLI 実行ログ（put / get / TTL 失効）の手順文書化と manual evidence テーブルが本 Phase の成果物

## 手動 smoke test コマンド手順

### 1. KV Namespace への put / get 確認

```bash
# staging に put
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
# 短い TTL（60 秒）で put（KV TTL 最小値）
wrangler kv:key put --binding=SESSION_KV --env=staging \
  --ttl=60 "ttl-test" "expires-soon"

# 即座に get（取得できる）
wrangler kv:key get --binding=SESSION_KV --env=staging "ttl-test"

# 60 秒以上待機（最終的一貫性のため余裕を持って 90 秒推奨）
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

## manual evidence テーブル

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
| AC-1〜AC-7 の証跡ドキュメントが揃っているか確認 | 実施可（本 Phase で完了） | Phase 7 の AC matrix と証跡パスを照合する | outputs/phase-07/ac-matrix.md |

## docs-only / NON_VISUAL タスク smoke test 方針

本タスクはタスク種別が **docs-only / NON_VISUAL** であるため、以下の方針を適用：

1. **UI スクリーンショットはすべて N/A**（NON_VISUAL のため UI 変更なし）
2. **CLI 実行ログ（put / get / TTL 失効）は実施可**。実施時は抜粋を `outputs/phase-11/cli-evidence-*.txt` に保存
3. **Worker コード経由の動作検証は下流タスクへ委譲**。本タスクでは CLI レベルの確認に留める
4. **本番環境での test-key 操作は原則実施しない**。必要な場合は別途承認・実施後は必ず delete でクリーンアップ

## ドキュメントレビュー結果

| 確認項目 | 結果 |
| --- | --- |
| AC matrix（Phase 7）と証跡パスの照合 | PASS（全 AC に証跡パスあり） |
| runbook（Phase 5）と smoke test コマンドの一致 | PASS |
| failure cases（Phase 6）の mitigation がドキュメントに反映 | PASS |
| Phase 12 close-out に必要な情報の充足 | PASS |

## 完了条件

- [x] 手動 smoke test コマンド手順が文書化されている
- [x] manual evidence テーブルの全項目に実施区分・N/A 理由・代替証跡が記録されている
- [x] NON_VISUAL のためスクリーンショット不要が明記されている
- [x] 実施不可項目の委譲先（下流タスク）が明記されている

## 次 Phase 引き継ぎ事項

- smoke test 結果（manual evidence テーブル / コマンド手順）を Phase 12 close-out に記録
- 委譲先情報（Worker コード経由検証は下流タスク）を Phase 12 unassigned-task-detection に反映
