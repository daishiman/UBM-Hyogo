[実装区分: 実装仕様書]

# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| task_type | NON_VISUAL |
| 前提 Phase | Phase 1（要件定義 完了） |
| 次 Phase | Phase 3（設計レビュー） |

## 目的

Phase 1 で固定した AC-1〜AC-12 を満たす設計を、ローテーション state machine / helper スクリプト API / SOP markdown 章立て / 完了記録テンプレフィールドの 4 concern に分けて確定する。stub §苦戦箇所の 5 件（grace period / staging→production 順序 / 無停止性確認 / stdin パイプ強制 / list は名前のみ）を全て Phase 2 内で反映する。

## 2.1 ローテーション state machine（苦戦箇所 1, 2, 3 反映）

```
[S0] 準備
  ├ Google Cloud Console で新 SA key 発行（gcloud iam service-accounts keys create）
  ├ 新 key を 1Password へ保管（op://<Vault>/<Item>/<Field> を更新）
  └ 旧 key fingerprint と新 key fingerprint を記録（実値は記録しない）

[S1] staging put
  └ op read "op://..." | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging

[S2] staging 検証
  ├ bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
  │   で name 存在確認
  ├ wrangler tail で 60 秒待機（新規リクエストが新 key で完走）
  └ UT-26 疎通テスト PASS 確認

[S3] production put（S2 PASS 後のみ）
  └ op read ... | bash scripts/cf.sh secret put ... --env production

[S4] production 検証
  ├ secret list で name 確認
  ├ wrangler tail 60 秒
  └ UT-26 疎通テスト PASS 確認

[S5] grace period（24〜48 時間）
  └ 旧 key は Google IAM 側で有効のまま放置（即時 disable 禁止）

[S6] 旧 key disable
  ├ Google Cloud Console で旧 key を disable（delete はしない）
  └ disable 時刻を記録

[S7] 7 日間保持
  └ disable 状態で 7 日経過観察。alert が発生したら S8 ではなく rollback へ

[S8] 旧 key delete
  └ Google Cloud Console で旧 key を delete
  └ delete 時刻を記録、UT-25-DERIV-02 へ fingerprint 連携
```

### 異常分岐

| 発生 state | 異常事象 | 対処 |
| --- | --- | --- |
| S2 | UT-26 疎通テスト FAIL | rollback: 旧 key 値を 1Password から再取得し staging へ再 put（`outputs/phase-13/rollback-runbook.md` 参照）|
| S4 | UT-26 疎通テスト FAIL | rollback: production へ旧 key 再 put |
| S5〜S7 | alert（UT-25-DERIV-02 等）発火 | 旧 key を再 enable し production へ再 put |

## 2.2 cf-rotate-sa-key.sh helper API 設計

### 採用方式の比較

| 方式 | 採用 | 理由 |
| --- | --- | --- |
| (A) `scripts/cf.sh` に `secret rotate` subcommand を追加 | 不採用 | `cf.sh` は汎用 wrapper 責務（op + esbuild + mise）に閉じている。rotation 専用ロジック（fingerprint 抽出 / dry-run / state machine guard）を混入させると単一責務を逸脱する |
| (B) 独立 `scripts/cf-rotate-sa-key.sh` を新規作成 | **採用** | rotation 固有責務に閉じる、テストが書きやすい、`cf.sh` の汎用性を汚さない。既存の `scripts/check-cf-rotation-reminder.sh` と命名整合（rotate 系の sibling）|

### コマンドライン仕様

```
Usage:
  scripts/cf-rotate-sa-key.sh <subcommand> [options]

Subcommands:
  put-staging     - op://参照から取得した値を staging へ stdin パイプで put
  put-production  - 同上を production へ put（S2 PASS 後のみ実行）
  verify          - secret list で name 存在を確認（環境別）
  tail            - wrangler tail を 60 秒実行してログ出力
  fingerprint     - stdin から JSON を受けて SHA-256 fingerprint だけを stdout に出す
                    （値そのものはログに残さない）

Options:
  --env <staging|production>  必須（subcommand によっては不要）
  --op-ref <op://Vault/Item/Field>  必須（put-* 系のみ）
  --dry-run         実 wrangler 呼び出しを抑止し計画のみを表示
  --no-history      HISTFILE=/dev/null と set +o history を強制（既定 true）
```

### 関数シグネチャ（bash function 単位）

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `enforce_history_off()` | なし | exit 1 if 失敗 | `HISTFILE=/dev/null` / `set +o history` 設定 |
| `assert_stdin_piped()` | fd 0 | exit 2 if TTY | `[[ -t 0 ]]` チェック |
| `compute_fingerprint(json_stdin)` | stdin JSON | SHA-256 16 進文字列 stdout | 値そのものは出力しない |
| `put_secret(env, op_ref)` | env / op_ref | exit code | `op read ... \| bash scripts/cf.sh secret put ... --env <env>` を実行 |
| `verify_name(env)` | env | exit code | `scripts/cf.sh secret list --env <env>` で `GOOGLE_SERVICE_ACCOUNT_JSON` 名前存在を grep |
| `tail_window(env, seconds)` | env / seconds（既定 60）| stdout ログ | `scripts/cf.sh tail --env <env>` を seconds 後に SIGTERM |
| `dry_run_guard(args)` | $@ | echo plan | `--dry-run` 指定時は echo のみ |

### 入出力契約

- 入力: 値（JSON）は **stdin パイプのみ**。コマンドライン引数 / 環境変数 / 一時ファイル経由は禁止
- 出力: stdout に fingerprint と verification 結果のみ。値そのものは stdout / stderr / ログのいずれにも出さない
- exit code: 0=成功、1=history 強制失敗、2=stdin TTY 検出、3=op read 失敗、4=cf.sh secret put 失敗、5=verify_name 失敗、6=tail timeout

## 2.3 SOP markdown 章立て（`runbooks/sa-key-rotation-sop.md`）

参考: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

```
# SA Service Account Key 定期ローテーション SOP

## メタ情報（対象 secret / 頻度 / 担当 / 最終更新）
## 1. 目的とスコープ
## 2. 頻度と採用根拠（90 日採用 / NIST SP 800-57 / Google IAM 推奨）
## 3. 前提条件（UT-25 完了 / UT-26 完了 / 1Password Vault パス確定）
## 4. ローテーション全体フロー（state machine 図、Phase 2 §2.1 と同一）
## 5. 手順
  5.1 新 SA key 発行（gcloud iam service-accounts keys create）
  5.2 1Password 反映
  5.3 staging put（cf-rotate-sa-key.sh put-staging）
  5.4 staging 検証（verify + tail 60 秒 + UT-26 疎通）
  5.5 production put
  5.6 production 検証
  5.7 grace period 24〜48 時間待機
  5.8 旧 key disable（7 日保持）
  5.9 旧 key delete
## 6. 無停止性確認の詳細（wrangler tail 60 秒の根拠）
## 7. rollback 経路（→ outputs/phase-13/rollback-runbook.md 逆参照）
## 8. shell 履歴抑止（HISTFILE=/dev/null / set +o history / tmux / screen scrollback クリア）
## 9. 完了記録テンプレ（→ runbooks/sa-key-rotation-records/TEMPLATE.md 逆参照）
## 10. UT-25-DERIV-02 への fingerprint 連携手順
## 11. FAQ / トラブルシュート
```

`check-cf-rotation-reminder.sh` との責務分離: 既存スクリプトは「次回ローテーション期日を通知」する read-only リマインダー。本タスクの `cf-rotate-sa-key.sh` は「ローテーション実行」を担う。SOP §11 で両者を区別する説明を入れる。

## 2.4 完了記録テンプレ（`runbooks/sa-key-rotation-records/TEMPLATE.md`）フィールド

```
# SA Key Rotation Record — YYYY-MM-DD

| 項目 | 値 |
| --- | --- |
| 実施日 | YYYY-MM-DD |
| 実施者 | <GitHub handle> |
| 対象 secret | GOOGLE_SERVICE_ACCOUNT_JSON |
| 旧 key fingerprint (SHA-256, 16 桁) | xxxxxxxxxxxxxxxx |
| 新 key fingerprint (SHA-256, 16 桁) | yyyyyyyyyyyyyyyy |
| 1Password 反映時刻 (UTC) | YYYY-MM-DDTHH:MM:SSZ |
| staging put 時刻 (UTC) | |
| staging 検証時刻 (UTC) | |
| production put 時刻 (UTC) | |
| production 検証時刻 (UTC) | |
| grace period 開始 (UTC) | |
| 旧 key disable 時刻 (UTC) | |
| 旧 key delete 時刻 (UTC) | |
| UT-26 疎通テスト結果 (staging / production) | PASS / PASS |
| 異常 / rollback 有無 | なし／あり（詳細） |
| UT-25-DERIV-02 fingerprint 連携日時 | |
| 備考 | |
```

> 注: fingerprint は SHA-256 の **先頭 16 桁** のみ記録する（key 値の復元を防ぐ）。`cf-rotate-sa-key.sh fingerprint` の出力をそのまま貼る。

## 2.5 dependency matrix（owner / co-owner）

| 共有モジュール | owner | co-owner | 同期タイミング |
| --- | --- | --- | --- |
| `scripts/cf.sh` | UT-25 系 | UT-25-DERIV-01 | 本タスクで cf.sh 本体は改修しない（参照のみ）|
| `docs/30-workflows/runbooks/` 配下 | UT-25-DERIV-01 | UT-17 系 | SOP 章立てを ut-17 runbook と整合 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | aiworkflow-requirements skill | UT-25-DERIV-01 | 逆参照 1 行追記 |

## validation matrix

| 検証対象 | コマンド | 期待 |
| --- | --- | --- |
| bats テスト | `bats scripts/__tests__/cf-rotate-sa-key.bats` | 全 PASS |
| shellcheck | `shellcheck scripts/cf-rotate-sa-key.sh` | exit 0 |
| markdownlint | `pnpm exec markdownlint docs/30-workflows/runbooks/sa-key-rotation-sop.md` | exit 0 |
| dry-run 実行 | `scripts/cf-rotate-sa-key.sh put-staging --op-ref op://Test/Test/Test --fingerprint 0123456789abcdef --env staging --dry-run` | plan 出力のみ・wrangler 未呼び |
| fingerprint 純粋性 | `echo '{}' \| scripts/cf-rotate-sa-key.sh fingerprint` | 16 桁 hex のみ stdout、値ログなし |

## 成果物

- 本 phase-2.md（state machine / helper API / SOP 章立て / record template / dependency matrix）

## 完了条件

- [ ] state machine S0〜S8 と異常分岐が定義されている
- [ ] helper CLI 仕様と関数シグネチャ・exit code が確定している
- [ ] (A) cf.sh subcommand vs (B) 独立 helper の比較結果と採用根拠が記載されている
- [ ] SOP markdown の章立てが ut-17 runbook 構造と整合している
- [ ] 完了記録テンプレフィールドに 8 必須項目（実施日 / 実施者 / 旧 fp / 新 fp / staging 検証 / production 検証 / disable / delete）が含まれている
- [ ] stub §苦戦箇所 5 件が全て本 Phase に反映されている
- [ ] validation matrix が 5 項目以上で定義されている

## 次 Phase

Phase 3（設計レビュー）
