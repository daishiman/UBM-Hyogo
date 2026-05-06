# Phase 6: 異常系検証 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

判定根拠: Phase 5 で導入する 3 成果物（runbook / 実施記録 / workflow yaml）は schedule トリガーで自動実行される副作用システムであり、誤起票・rotation 失敗・rollback 不能はいずれも運用事故を起こし得る。CONST_004 に従い異常系も実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 6 / 13 |
| wave | post-U-FIX-CF-ACCT-01 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 3 リスクマトリクス R1〜R10 / Phase 4 の境界値テスト / Phase 5 各 Step の blast radius を踏まえ、本タスク特有の 10 異常系シナリオを「検出方法 / 対処手順 / 予防策」の 3 軸で定義する。Phase 7 AC マトリクスの異常系列に 1:1 で接続する。

## 異常系シナリオ表

各シナリオは「detection（検出方法）」「response（対処手順）」「prevention（予防策）」の 3 列で記述。Phase 11 で実測対象は `実測` 列で示す。

### S1. schedule workflow が trigger されない（cron 構文ミス / disabled）

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R10 派生（runbook 陳腐化）/ Phase 3 設計盲点 |
| 検出方法 | `gh run list --workflow=cf-token-rotation-reminder.yml --limit 7` で過去 7 日に 1 件も run がないこと。または `gh workflow view cf-token-rotation-reminder.yml` で `State: disabled_manually` |
| 対処手順 | (1) yaml `on.schedule.cron` 構文を `actionlint` で再検証 / (2) `gh workflow enable cf-token-rotation-reminder.yml` / (3) `gh workflow run cf-token-rotation-reminder.yml -f dry_run=true` で疎通確認 |
| 予防策 | Phase 5 Step 6 で `actionlint` 必須化。runbook §3 事前確認に「直近 7 日に reminder workflow run があるか」チェックを追加 |
| 実測 | Phase 11 で sync:check と並行確認 |

### S2. Issue 起票 API が rate-limit / permissions エラー

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R7 派生 |
| 検出方法 | step `Create issue` の exit != 0、`gh: HTTP 403` / `HTTP 429` を含む stderr |
| 対処手順 | (1) `permissions: issues: write` が yaml にあるか確認 / (2) Org / Repo settings の Actions 権限が `Read and write` であるか確認 / (3) 429 の場合は次回 cron で自動再試行されるため即時対応不要、ただし stderr を `audit_log` 相当に記録（Phase 5 Step 3 で workflow に `if: failure()` step を追加可、本タスクでは見送り）。手動 fallback として runbook §9 既知の落とし穴に「workflow fail 時は手動で Issue を起票」と明記 |
| 予防策 | Phase 5 Step 3 で `permissions:` を最小権限に固定。Phase 7 AC で `permissions:` を機械検証 |
| 実測 | NA（rate-limit を意図的に再現しない） |

### S3. 重複 Issue 起票（既に起票済み Issue がある）

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R7 |
| 検出方法 | step `Detect existing open reminder issue` で `count >= 1` かつ後続 `Create issue` step が skip されること |
| 対処手順 | 既存 Issue で対応中であれば追加対応不要。誤検知（プレフィックス衝突）時は (1) Issue 本文と title を確認 / (2) `gh issue list --state open --search 'in:title "[cf-token-rotation]"'` で衝突 Issue を特定 / (3) 衝突 Issue を close または title 変更し再 dispatch |
| 予防策 | title プレフィックスを `[cf-token-rotation] 90日rotation期日が接近` のように固有性の高い文字列に固定（Phase 2 設計）。Phase 4 T16 で実測 |
| 実測 | Phase 11 T16 |

### S4. 90 日経過判定の境界値（85 / 89 / 90 / 91 日）

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R6 派生 |
| 検出方法 | T09-T12 evidence で `should_remind` 期待値と実測値の比較 |
| 期待動作 | 84 日: `should_remind=false` / 85 日: `true` / 89 日: `true`, `due_at=今日+1` / 90 日: `true`, `due_at=今日` / 91 日: `true`, `due_at=今日-1` |
| 対処手順 | 期待値ズレ時は `date -u -d` の解釈差を疑い、yaml `Compute elapsed days and decide` step を `set -euo pipefail` 配下で再実装。GNU date 環境（ubuntu-latest）固定を維持 |
| 予防策 | Phase 4 T09-T12 で 5 ケースを Phase 11 必須実測に含める。`scripts/check-cf-rotation-reminder.sh --simulate-elapsed` をローカル CI 化 |
| 実測 | Phase 11 T09-T12 |

### S5. rotation 実施中に staging smoke が失敗 → production rotation を実施しない gate

| 項目 | 内容 |
| --- | --- |
| 関連リスク | runbook 構造ガード |
| 検出方法 | runbook §4.5 の `bash scripts/cf.sh deploy --env staging` が exit != 0、または `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` で接続エラー |
| 対処手順 | (1) 即座に runbook §6 rollback に切替 / (2) 旧 staging Token を Dashboard で再有効化 / (3) `gh secret set CLOUDFLARE_API_TOKEN --env staging` で旧 Token 値を再注入 / (4) 新 staging Token を Dashboard で失効 / (5) 実施記録 §rollback 有無 列に「あり」と経緯 1〜3 行を追記 |
| 予防策 | runbook §5 冒頭に「§4 全 PASS を G2 で承認してから本節へ進む」を必須ゲートとして明記（Phase 2 設計）。production rotation に進む user approval を Claude Code 側でも自走禁止扱い |
| 実測 | NA（実 rotation は本タスク Phase 範囲外） |

### S6. 24h 並行運用中に旧 Token を誤失効

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R5 |
| 検出方法 | 実施記録の「旧 Token 無効化時刻」と「旧 Token 削除時刻」が同日かつ間隔が 24h 未満。または rollback 実施時に Cloudflare Dashboard で旧 Token が「Deleted」状態 |
| 対処手順 | S7 へ移行（旧 Token 再有効化不可）。新 Token を再発行し runbook §4 から再実行 |
| 予防策 | 実施記録テンプレに「無効化時刻」と「削除時刻」を別フィールドとして分離（Phase 2 設計）。runbook §4.7 / §5.7 に「24h 並行運用中は disable のみ・delete 禁止」を強調記載 |
| 実測 | NA |

### S7. rollback 時に旧 Token 再有効化が不可（Cloudflare 側で削除済み）→ 新 Token 再発行手順

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R5 |
| 検出方法 | runbook §6.1 の「Dashboard で disabled → enabled」操作で対象 Token が一覧に存在しない |
| 対処手順 | (1) 緊急で新 Token を発行（最小 scope を踏襲） / (2) 1Password Item を新値で更新 / (3) `gh secret set CLOUDFLARE_API_TOKEN --env <env>` で再注入 / (4) staging smoke から runbook §4 を再実行 / (5) 実施記録 §rollback に「旧 Token 削除済みのため新 Token 再発行」と明記 |
| 予防策 | S6 と同じ。runbook §9 既知の落とし穴に本シナリオを記載 |
| 実測 | NA |

### S8. 1Password reminder 未設定で期日を逃す

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R6 / Phase 3 設計盲点（個人通知前提） |
| 検出方法 | `vars.CF_TOKEN_ISSUED_AT` から 90 日経過後も rotation が実施されていない（GitHub Issue は起票済みだが close されていない / 実施記録に新 entry なし） |
| 対処手順 | (1) GitHub Issue を最優先タスクとして即着手 / (2) runbook §3 事前確認の 1Password expiry reminder 設定を再実施 / (3) 実施記録に「reminder 未設定により遅延」と経緯記載 |
| 予防策 | (a) 自動 Issue 起票が一次セーフティネット（Phase 2 設計）/ (b) runbook §7 で 1Password expiry reminder 設定手順を必須化 / (c) GitHub Issue 起票後 7 日以内に未着手なら追加 reminder を起票する次サイクル拡張を unassigned-task に残す（CONST_007 派生） |
| 実測 | NA |

### S9. CODEOWNERS 経由 assignee 未マッチ

| 項目 | 内容 |
| --- | --- |
| 関連リスク | Phase 3 設計盲点 |
| 検出方法 | step `Create issue` で `--assignee daishiman` が `gh: assignee not found` エラー、または起票成功するが Issue 上で assignee 未設定 |
| 対処手順 | (1) `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` を実行し errors 配列が空であることを確認 / (2) yaml の `DEFAULT_ASSIGNEE` を `${{ github.repository_owner }}` に切替えて再実行検討 / (3) 起票済み Issue は手動で assignee 設定 |
| 予防策 | Phase 5 Step 3 で `DEFAULT_ASSIGNEE: 'daishiman'` を env に固定し、yaml レベルで明示。CODEOWNERS と integration test を Phase 11 で実施 |
| 実測 | Phase 11 T15 で起票後 assignee を確認 |

### S10. Token scope drift（rotation 時に scope を意図せず変更）

| 項目 | 内容 |
| --- | --- |
| 関連リスク | R4 派生 |
| 検出方法 | rotation 後の `bash scripts/cf.sh whoami` 出力 scope 行が、U-FIX-CF-ACCT-01 で確立した最小 scope と差分（diff > 0） |
| 対処手順 | (1) 直前の rotation を rollback（runbook §6） / (2) Cloudflare Dashboard で新 Token を失効 / (3) U-FIX-CF-ACCT-01 仕様の最小 scope に合わせて新 Token を再発行 / (4) 実施記録 §検証結果サマリ に「scope drift により再発行」と記録 |
| 予防策 | (a) runbook §4.2 / §5.2 に「scope は U-FIX-CF-ACCT-01 で確立した最小 scope を踏襲」を必須項目化 / (b) runbook §3 事前確認に「`bash scripts/cf.sh whoami` で現行 scope を記録 → rotation 後に diff 確認」を含める / (c) 実施記録 §検証結果サマリ に scope diff 確認チェック項目を追加 |
| 実測 | NA（実 rotation 時に確認） |

## 横断する検出機構

| 機構 | 範囲 | 配置場所 |
| --- | --- | --- |
| `actionlint` / `yamllint` 静的検証 | S1, S2, S9 | Phase 5 Step 6 / CI |
| `--simulate-elapsed` 単体検証 | S4 | Phase 5 Step 6 / CI |
| `--check-no-secret` / `--check-no-token-id` grep | R1（全シナリオ横断のセキュリティ ground floor） | Phase 5 Step 6 / Phase 7 AC |
| 重複起票検知 step | S3 | yaml step `Detect existing open reminder issue` |
| `vars.CF_TOKEN_ISSUED_AT` 未設定 guard | S8 派生 | yaml `Compute` step の `::error::` |
| runbook §3 事前確認チェックリスト | S1, S5, S6, S10 | runbook 文書 |
| 実施記録テンプレ「無効化時刻」「削除時刻」分離 | S6, S7 | log テンプレ |

## 異常系 evidence 保存先

| シナリオ | evidence path（Phase 11 で取得） |
| --- | --- |
| S1 | `outputs/phase-11/evidence/abnormal/s1-no-recent-runs.log`（取得不能ならスキップ理由を文書化） |
| S2 | NA（再現せず）。runbook §9 への記述で代替 |
| S3 | `evidence/dryrun/workflow-dispatch-dup.log`（T16 と同一） |
| S4 | `evidence/dryrun/elapsed-{84,85,89,90,91}.log`（T09-T12 と同一） |
| S5 〜 S7, S10 | NA（実 rotation を伴わない）。runbook §6 / §9 記述で代替 |
| S8 | NA。runbook §7 記述で代替 |
| S9 | `evidence/dryrun/workflow-dispatch-real.log`（T15 内で assignee を確認） |

## 異常系 RACI

| 役割 | 責務 |
| --- | --- |
| Operator (`@daishiman`) | runbook §4-§7 / §8 実施、実施記録 append |
| GitHub Actions | S1, S3, S4, S8 の自動検出 / 起票 |
| Phase 4 検証スクリプト | S4 境界値の単体検証 |
| Phase 7 AC | S1〜S10 の検証可否を機械検証可能化 |

## 参照資料

- `phase-01.md` 〜 `phase-05.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-06.md`（フォーマット参考）
- `CLAUDE.md`（Cloudflare CLI ルール / Governance）
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`

## 統合テスト連携

- 上流: Phase 4 テスト戦略 T09-T16
- 下流: Phase 7 AC マトリクス（異常系 列） / Phase 11 実測

## 多角的チェック観点

- 10 シナリオすべてが「検出 / 対処 / 予防」3 軸で揃っている
- R1〜R10 リスク（Phase 3）と S1〜S10 シナリオの紐付けが漏れていない
- staging-first / 24h 並行 / rollback の 3 段ガードが S5-S7 に組み込まれている
- 自動化が暴走しても `gh workflow disable` で停止可能（S1 対処手順）
- Token 値混入リスクは「全シナリオ横断のセキュリティ ground floor」として `--check-no-secret` で覆う

## サブタスク管理

- [ ] S1 〜 S10 の検出 / 対処 / 予防を確定
- [ ] 横断検出機構表を確定
- [ ] 異常系 evidence path を Phase 11 に引き渡し
- [ ] `outputs/phase-06/main.md` を作成

## 成果物

- `outputs/phase-06/main.md`

## 完了条件

- [ ] 10 シナリオが検出 / 対処 / 予防の 3 軸で揃っている
- [ ] Phase 3 R1〜R10 と S1〜S10 の対応関係が明示されている
- [ ] Phase 11 で実測するシナリオ（S3, S4, S9）と NA シナリオが分離されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で実 rotation / 実 secret 注入 / 実 GitHub Actions 起動を実行していない
- [ ] CONST_007 に従い、未確定の境界値検証は Phase 11 へ引き渡されている

## 次 Phase への引き渡し

Phase 7 へ:

- S1〜S10 を AC マトリクスの異常系列に展開
- evidence path（S3 / S4 / S9）

Phase 11 へ:

- 実測対象シナリオ S3 / S4 / S9 の手順
- NA シナリオの runbook §6 / §9 記述による代替 evidence

## 実行タスク

- [ ] phase-06 の既存セクションに記載した手順・検証・成果物作成を実行する。
