# Phase 7: 受入条件マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| ID | UT-06-FU-E |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 受入条件マトリクス |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (異常系・エラーハンドリング) |
| 次 Phase | 8 (セキュリティ・コンプライアンス) |
| 状態 | spec_created |
| 推奨Wave | Wave 2 |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |
| GitHub Issue | #118（CLOSED） |

## 目的

`index.md` / 原典スペックで固定された **AC-1〜AC-9** を左軸、Phase 4 で定義された **happy path テスト T1〜T7** と Phase 6 で確定した **異常系シナリオ E1〜E7** を右軸とし、各セルに「該当テスト ID」「N/A」「Phase 11 smoke で確認」「spec レビュー完結」のいずれかを記述する trace matrix を作成する。あわせて AC ごとの reverse trace 表（検証 Phase / 検証コマンド / 期待値 / 残存 open question）を最終確定し、Phase 3 で登録した open question の Phase 配分を最終確認する。本 Phase は仕様化のみで、実走（コマンド出力収集）は Phase 13 ユーザー承認後の別 PR / Phase 11 smoke 実走に委ねる。

## 真の論点

- カバレッジ穴ゼロを担保しつつ、**「Phase 11 smoke へ過剰委譲しない」+「spec レビューで確定可能な AC を spec 列で完結させる」** バランスを matrix 上で可視化する。
- AC-7（`scripts/cf.sh d1 export` 経由）/ AC-8（採用ルート別の無料枠監視）/ AC-9（暗号化方式記録）が spec 列で確定しているか、別途実装証跡が必要かを Phase 7 で再確認する。

## 依存境界

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Phase 4 T1〜T7 | matrix 右軸 |
| 上流 | Phase 6 E1〜E7 | matrix 右軸 |
| 下流 | Phase 8 / 9 / 11 / 12 | 検証 Phase 配分先 |

## 価値とコスト

- 価値: Phase 13 user_approval ゲートで「全 AC が証跡付きで満たされた」ことを 1 表で説明可能になる。
- コスト: matrix 維持コストは Phase 4 / 6 のラベル変更に追従する程度。

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | matrix 全行 9 が T / E / P11 / spec のいずれかで被覆 |
| 漏れなし | OK | カバレッジ穴ゼロ |
| 整合性 | OK | reverse trace 表で AC 別検証 Phase が一意に決まる |
| 依存関係整合 | OK | open question 全件が受け皿 Phase に紐付き |

## 既存命名規則の確認

- AC 番号: AC-1〜AC-9
- 凡例: `T<n>` / `E<n>` / `P11` / `spec`

## 実行タスク

1. AC × T/E trace matrix（AC-1〜AC-9 × T1〜T7 + E1〜E7 の 9 行 × 14 列）を作成（完了条件: 全行に最低 1 つの被覆セル）。
2. AC ごとの reverse trace 表（検証 Phase / 検証コマンド / 期待値 / 残存 open question）を 9 行で確定（完了条件: 9 行全項目記述）。
3. open question の最終 Phase 配分を再確認（完了条件: 全件受け皿 Phase に紐付き）。
4. P11 のみで確認可能な AC を明示（完了条件: AC-1 / AC-2 / AC-4 / AC-5 を P11 でマーク）。
5. spec レビューで完結する AC を明示（完了条件: AC-7 / AC-8 / AC-9 の一部）。
6. 多角的チェックで不変条件 #5 / カバレッジ穴 / Phase 11 過剰委譲 を再確認（完了条件: 3 観点記述）。
7. Phase 8 への引き渡し（AC-3 / AC-9 / E2 / E4 / E7）を固定（完了条件: 引き渡し記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md | AC-1〜AC-9 の正本 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-04.md | T1〜T7 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-06.md | E1〜E7 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-03.md | open question 受け皿 Phase |
| 必須 | CLAUDE.md §不変条件 #5 / §Cloudflare 系 CLI 実行ルール | AC-7 / AC-9 の根拠 |

## スコープ

### 含む
- 9 AC × 14 列の matrix
- AC reverse trace 表
- open question 配分の最終確認

### 含まない
- 実走証跡の収集（Phase 11）
- matrix 内セルの自動計算（手動 SSOT）

## T1〜T7 / E1〜E7 のラベル（Phase 4 / 6 入力前提）

| ID | テスト命題（Phase 4） | 観点 |
| --- | --- | --- |
| T1 | cron 成功 log 検証 | AC-1 |
| T2 | R2 直近 30 日 + 月次世代確認 | AC-2 |
| T3 | SSE / private bucket 確認 | AC-3 / AC-9 |
| T4 | 失敗時 UT-08 通知 dry-run | AC-5 |
| T5 | 復元 drill（机上 / 実 D1） | AC-4 |
| T6 | 空 export 許容バリデーション | AC-6 |
| T7 | SHA-256 hash 整合性 | AC-2 / AC-4 補強 |

| ID | 異常系命題（Phase 6） | 観点 |
| --- | --- | --- |
| E1 | 空 export false negative 抑止 | AC-6 |
| E2 | R2 quota 超過 / 容量警告 | AC-2 |
| E3 | cron 失敗（Workers timeout / API rate limit / GHA runner 失敗）| AC-1 / AC-8 |
| E4 | 暗号化キーローテーション失敗 | AC-3 / AC-9 |
| E5 | export 中断（network / D1 lock）| AC-1 / AC-2 |
| E6 | 復元時 schema 不整合（migration 適用前後取り違え）| AC-4 |
| E7 | SHA-256 hash mismatch | AC-2 / AC-4 |

## AC × T/E trace matrix

凡例:
- `T<n>` / `E<n>` = 該当テスト ID
- `N/A` = 別軸で確認、該当テスト無し
- `P11` = Phase 11 smoke 実走で確認
- `spec` = Phase 1〜3 / Phase 8 仕様レビューで確認済み（テスト不要）

| AC \ Test | T1 | T2 | T3 | T4 | T5 | T6 | T7 | E1 | E2 | E3 | E4 | E5 | E6 | E7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1（日次 cron 稼働 + 成功 log）| T1 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | E3 | N/A | E5 | N/A | N/A |
| AC-2（R2 30 日 + 月次世代）| N/A | T2 | N/A | N/A | N/A | N/A | T7 | N/A | E2 | N/A | N/A | E5 | N/A | E7 |
| AC-3（SSE / KMS / ACL）| N/A | N/A | T3 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | E4 | N/A | N/A | N/A |
| AC-4（復元 runbook + 机上演習）| N/A | N/A | N/A | N/A | T5 | N/A | T7 | N/A | N/A | N/A | N/A | N/A | E6 | E7 |
| AC-5（失敗時 UT-08 通知）| N/A | N/A | N/A | T4 | N/A | N/A | N/A | E1 | E2 | E3 | E4 | N/A | N/A | E7 |
| AC-6（空 export 許容バリデーション）| N/A | N/A | N/A | N/A | N/A | T6 | N/A | E1 | N/A | N/A | N/A | N/A | N/A | N/A |
| AC-7（`scripts/cf.sh d1 export` 経由）| T1 | spec | spec | N/A | spec | spec | spec | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| AC-8（GHA 採用時 UT-05-FU-003 / cron 採用時無料枠）| T1 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | E3 | N/A | N/A | N/A | N/A |
| AC-9（機密性レベル別暗号化方式記録）| N/A | N/A | T3 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | E4 | N/A | N/A | N/A |

> 全 AC が最低 1 つの T / E / P11 / spec で被覆されている（カバレッジ穴 = 0）。

### マトリクス読み解き

- **happy path 寄り**: AC-1（T1）/ AC-3（T3）/ AC-6（T6）。
- **happy + fail 多軸**: AC-2（T2 / T7 + E2 / E5 / E7）/ AC-4（T5 / T7 + E6 / E7）/ AC-5（T4 + E1 / E2 / E3 / E4 / E7）。
- **spec レビュー完結**: AC-7 が大半 spec / コマンド形（T1）で被覆。AC-9 は T3 + E4 + Phase 8 spec で被覆。
- **無料枠監視**: AC-8 は T1（cron 成功 log）+ E3（cron failure）の 2 軸で UT-05-FU-003 / Phase 9 と接続。

## AC 個別検証表（reverse trace）

| AC | 検証 Phase | 検証コマンド / 観測手段 | 期待値 | 残存 open question |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 5 + Phase 11 + T1 | (A) `wrangler tail` 等価出力 / (B) `gh run list --workflow=d1-backup.yml` | 直近 24h で success run ≧ 1 件 | open #A（採用ルート最終決定）→ Phase 5 着手前 |
| AC-2 | Phase 5 + Phase 11 + T2 / T7 | `bash scripts/cf.sh r2 object list ubm-hyogo-d1-backup --prefix daily/` / `--prefix monthly/` | daily ≧ 28、monthly に当月 + 前月 | open #B（lifecycle rule 文法）→ Phase 5 |
| AC-3 | Phase 5 + Phase 8 + T3 | `bash scripts/cf.sh r2 bucket info ubm-hyogo-d1-backup` + anonymous curl 403 | private + SSE 有効 | open #C（SSE-S3 vs SSE-C 採用）→ Phase 8 |
| AC-4 | Phase 11 + Phase 12 + T5 / T7 | restore runbook checklist + drill 実走 | runbook 全 step 通過 + restore 後行数一致 | 月次 drill に確定 |
| AC-5 | Phase 6 + Phase 11 + T4 | `D1_BACKUP_FORCE_FAIL=1` で UT-08 test channel 着信確認 | event 名 = `D1_BACKUP_FAILED` 等が 1 件 | なし |
| AC-6 | Phase 5 + Phase 6 + T6 / E1 | `ALLOW_EMPTY=1` 経路 dry-run | size < 50 でも exit 0 + warn log | なし |
| AC-7 | Phase 5 + spec | `rg "wrangler " docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/`（直接実行混入確認）| 0 件 | なし |
| AC-8 | Phase 9 + T1 / E3 | UT-05-FU-003 監視（GHA）/ Cloudflare cron 5 件枠確認 | 採用ルートに応じた監視点が active | open #E（採用ルート切替条件）→ Phase 5 / Phase 9 |
| AC-9 | Phase 8 + T3 / E4 | 暗号化方式記録（SSE-S3 / SSE-C / KMS）+ rotation SOP | 機密性レベル別の選定根拠が記述 | open #C 連動 |

## open question Phase 配分（最終確認）

| # | 質問 | Phase 3 振り分け | 本 Phase での再確認 | 最終受け皿 |
| --- | --- | --- | --- | --- |
| A | 採用ルート最終決定（cron triggers vs GHA）| Phase 5 着手前 | base case = ルート A だが切替条件を明記済み | Phase 5（決定）+ Phase 9（監視点 follow） |
| B | R2 lifecycle rule 文法（30 日後 monthly 移動 + 60 日経過月次以外削除）| Phase 5 | rule expression は別 PR で確定 | Phase 5（実装時）|
| C | SSE-S3 vs SSE-C vs KMS の選定 | Phase 8 | 機密性レベル（PII 含む可能性）の判定後決定 | Phase 8（決定）+ Phase 5 Step 1 / 3 で反映 |
| D | drill 頻度 | Phase 12 | 月次 SOP として確定 | Phase 12（SOP）|
| E | 採用ルート切替条件（cron 5 件枠超過時 GHA へ）| Phase 9 | base case ルート A の縮退路として記述済み | Phase 9（監視点）+ Phase 5（手順）|

> 5 件すべて受け皿 Phase に紐付き、本 Phase で新規 open question は発生しない。

## 実行手順

1. matrix 9 行 × 14 列を埋め空セルゼロを確認。
2. reverse trace 表 9 行を確定。
3. open question 5 件の最終配分を確認。
4. P11-only AC を明示。
5. 多角的チェック再実行。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | AC-3 / AC-9（暗号化方式）+ E2 / E4 / E7 を脅威モデル S1〜S7 の入力へ |
| Phase 9 | AC-8 + E3 を SLO（cron 24h 連続失敗）監視へ |
| Phase 10 | matrix 全 AC 被覆を GO/NO-GO 根拠に再利用 |
| Phase 11 | AC-1 / AC-2 / AC-4 / AC-5 を smoke 期待値テンプレに反映 |
| Phase 12 | open question D（drill 頻度）+ AC-4 SOP をドキュメント化 |

## 多角的チェック観点

- **不変条件 #5（AC-7 / AC-9）**: T1〜T7 / E1〜E7 すべての検証主体が `apps/web` に依存しないか。matrix の `spec` セルは Phase 1〜3 で確認済み。
- **カバレッジ穴**: 9 AC × 14 列のすべての行に最低 1 つのセルが「テスト ID / P11 / spec」で埋まっているか。本 Phase では空行ゼロを完了条件にロック。
- **Phase 11 過剰委譲**: AC-1 / AC-2 / AC-4 / AC-5 の spec 段階で確認可能な部分（コマンド形 / runbook 整備）を P11 に丸投げしていないか。本 matrix は Phase 5 + Phase 11 の 2 段構成で確認する設計。
- **無料枠監視**: AC-8 が T1 + E3 の 2 軸で UT-05-FU-003 / Phase 9 に渡されているか。
- **空 export 境界**: AC-6 が T6 + E1 の両軸で被覆され、`ALLOW_EMPTY` 経路が一貫しているか。
- **暗号化方式選定**: AC-9 が T3（実測）+ E4（rotation 異常系）+ Phase 8 spec の三位一体で被覆されているか。
- **open question の漏れ**: 5 件すべてが受け皿 Phase に紐付き、新規 open question が発生していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC × T/E trace matrix（9 × 14）| 7 | spec_created | 空セルゼロ |
| 2 | AC reverse trace 表（9 行）| 7 | spec_created | 検証 Phase / コマンド / 期待値 / open question |
| 3 | open question 5 件最終配分 | 7 | spec_created | 全件紐付き |
| 4 | P11-only AC 明示 | 7 | spec_created | AC-1 / AC-2 / AC-4 / AC-5 |
| 5 | spec-only AC 明示 | 7 | spec_created | AC-7 / AC-9 一部 |
| 6 | 多角的チェック | 7 | spec_created | 3 観点 |
| 7 | Phase 8 への引き渡し | 7 | spec_created | AC-3 / AC-9 / E2 / E4 / E7 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-07.md | AC × T/E trace matrix / AC 個別 reverse trace / open question 最終配分 |

> 本 Phase の成果物は本ファイル（phase-07.md）のみ。`outputs/phase-07/main.md` は本ワークフローでは作成せず、artifacts.json `phases[6].outputs` は空配列のまま。

## 完了条件

- [ ] AC-1〜AC-9 × T1〜T7 + E1〜E7 の 9 行 × 14 列 matrix に空セルが無い（最低 1 セルが T / E / P11 / spec で被覆）
- [ ] AC reverse trace 表が 9 行で「検証 Phase / 検証コマンド / 期待値 / 残存 open question」の 4 列を埋めている
- [ ] open question 5 件すべての最終受け皿 Phase が再確認されている
- [ ] AC-1 / AC-2 / AC-4 / AC-5 が Phase 11 smoke で確認される旨が明記されている
- [ ] AC-7 / AC-9 の一部が spec レビューで完結する旨が明記されている
- [ ] 多角的チェックで不変条件 #5 / カバレッジ穴 / Phase 11 過剰委譲 の 3 観点が記述されている
- [ ] AC-8 が T1 + E3 の 2 軸で UT-05-FU-003 / Phase 9 に渡されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- AC × T/E trace matrix が 9 × 14 の表として本ファイルに収録
- open question 5 件全件が受け皿 Phase に紐付き
- 不変条件 #5 が多角的チェックに記述
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8 (セキュリティ・コンプライアンス)
- 引き継ぎ事項:
  - AC-3 / AC-9（暗号化方式）+ E4（rotation 失敗）+ E7（hash mismatch）を Phase 8 §脅威モデルへ
  - open question C（SSE-S3 / SSE-C / KMS 選定）を Phase 8 §機密性レベル判定へ
  - AC-7（`scripts/cf.sh` 経由）を Phase 8 コンプライアンス章で再ロック
  - matrix 全 AC 被覆を Phase 10 GO/NO-GO 根拠に再利用
- ブロック条件:
  - matrix に空行がある（カバレッジ穴）
  - open question のいずれかに受け皿 Phase が紐付かない
  - AC-9 reverse trace で暗号化方式記録が欠落
  - 不変条件 #5 が AC-7 行で `spec` 化されていない
