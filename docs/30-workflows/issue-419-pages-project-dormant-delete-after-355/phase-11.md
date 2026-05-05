[実装区分: 実装仕様書]

# Phase 11: 削除運用 evidence 取得（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 11 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| 親 Issue | #355 (CLOSED) — `Refs #355` のみ使用 |

## visualEvidence 区分

`NON_VISUAL` — 本タスクは Cloudflare API 操作のみ。screenshot は不要、CLI 出力（redacted）と日付記録ベースで evidence を構成する。

## 目的

Cloudflare Pages dormant プロジェクトの物理削除 runtime 運用に必要な evidence ファイル群を `spec_created` 段階で skeleton として宣言・配置し、後続 runtime cycle が値を埋めて PASS 化できる契約（`PENDING_RUNTIME_EXECUTION`）を確立する。

## 入力

- Phase 01〜10 の決定事項
- `bash scripts/cf.sh` ラッパー（Cloudflare CLI 呼び出しの正本）
- 親 Issue #355 の Workers cutover 成果（VERSION_ID / route / smoke evidence）

## 設計 PASS と runtime PASS の境界（deploy-deferred contract）

本 Phase 11 の declared evidence は spec_created 段階で skeleton 配置され、runtime 実行（user 承認後の別 cycle）で値が埋められる。`spec_created` 段階で evidence file が存在することと、その内容が PASS していることは別軸である。

| 段階 | declared file の状態 | 判定 |
| --- | --- | --- |
| spec_created（本サイクル） | skeleton 実体あり、各ファイル先頭に `state: PENDING_RUNTIME_EXECUTION` | 設計 PASS |
| runtime cycle（user 承認後） | 実日付・redacted CLI 出力・PASS 判定が埋まる | runtime PASS |

## declared outputs（spec_created で skeleton 必須実体化）

| ファイル | 内容 | 初期 state |
| --- | --- | --- |
| `outputs/phase-11/main.md` | Phase 11 サマリ（spec_created 段階のステータス記録） | `PENDING_RUNTIME_EXECUTION` |
| `outputs/phase-11/preflight-ac1-ac2.md` | AC-1: Workers cutover 完了確認（route / VERSION_ID / smoke） / AC-2: Pages dormant 確認（custom domain detach / 直近 deploy 日 / トラフィック 0） | `PENDING_RUNTIME_EXECUTION` |
| `outputs/phase-11/workers-pre-version-id.md` | rollback 戻り先 1 段目（Workers の現行 VERSION_ID と直前 VERSION_ID） | `PENDING_RUNTIME_EXECUTION` |
| `outputs/phase-11/dormant-period-log.md` | AC-3: 観察期間（開始日 / 終了日 / Workers 4xx・5xx エラー率推移、≥ 2 週間） | `PENDING_RUNTIME_EXECUTION` |
| `outputs/phase-11/user-approval-record.md` | AC-4: user 明示承認文言の引用（PR comment / Issue comment いずれか） | `PENDING_RUNTIME_EXECUTION` |
| `outputs/phase-11/deletion-evidence.md` | `bash scripts/cf.sh pages project delete` の redacted 出力 + exit code | `PENDING_RUNTIME_EXECUTION` |
| `outputs/phase-11/post-deletion-smoke.md` | 削除後 Workers production が 200 OK を返すことの smoke 確認 | `PENDING_RUNTIME_EXECUTION` |
| `outputs/phase-11/redaction-check.md` | AC-5: token / Bearer / sink URL query / OAuth value の grep 結果（0 件 PASS） | `PENDING_RUNTIME_EXECUTION` |

各 evidence ファイルは Phase 5 実装ランブック（`runbook.md`）の指示に従い skeleton として配置する。本 phase-11.md は仕様書として「これら 7 ファイル + main.md の skeleton も spec_created 段階で実体化が必要である」ことを明記する。

## 共通ヘッダーフォーマット（各 evidence file 先頭）

```markdown
# <ファイル名>

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: <AC-N>
```

runtime cycle は `state` を `PASS` / `FAIL` / `BLOCKED` に書き換え、`date` / `operator` / `redaction` / `runtime_pass` を埋める。

## 取得手順（runbook.md に詳細）

1. **AC-1 Workers cutover 完了確認**
   - `bash scripts/cf.sh whoami` で auth 確認
   - Workers production の deployments list を取得し最新 VERSION_ID を `workers-pre-version-id.md` へ記録
   - staging / production smoke の link / hash を `preflight-ac1-ac2.md` へ記録
2. **AC-2 Pages dormant 確認**
   - Pages プロジェクトの custom domain attachment が空であること
   - 直近 deploy が cutover 以前であることを `preflight-ac1-ac2.md` へ記録
3. **AC-3 dormant 観察開始**
   - 観察開始日を `dormant-period-log.md` へ記録
   - Workers 側 4xx / 5xx エラー率を週次で append
4. **観察期間 ≥ 2 週間経過**
   - 観察終了日と推移サマリを `dormant-period-log.md` へ記録
5. **AC-4 user 明示承認**
   - PR comment / Issue comment にユーザーが「削除実行を承認する」旨を記入
   - 該当文言を `user-approval-record.md` へ引用、URL / 日付 / ユーザー ID を記録
6. **削除実行**
   - `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` を実行
   - 出力を redact して `deletion-evidence.md` に保存（exit code = 0 確認）
7. **AC-5 redaction 検証**
   - `rg -i "(CLOUDFLARE_API_TOKEN|Bearer |\?token=|access_key|secret)" outputs/phase-11/` が 0 件
   - 結果を `redaction-check.md` へ記録
8. **削除後 smoke**
   - Workers production URL が 200 OK を返すことを再確認、結果を `post-deletion-smoke.md` へ記録
9. **main.md 確定**
   - 上記 7 ファイルの結果サマリを `main.md` に集約し `state: PASS` へ書き換え

## redaction ルール

| 対象 | 例 | 置換 |
| --- | --- | --- |
| Cloudflare API Token | `CLOUDFLARE_API_TOKEN=xxx` | `CLOUDFLARE_API_TOKEN=<REDACTED>` |
| Bearer ヘッダ | `Authorization: Bearer xxx` | `Authorization: Bearer <REDACTED>` |
| Logpush sink URL query | `?token=xxx` | `?token=<REDACTED>` |
| OAuth value | `access_token=xxx` | `access_token=<REDACTED>` |
| Account ID | 数値そのまま許容（非機密設定値） | redact 不要 |

## 関数・型・モジュール

無し（CLI ラッパー実行と markdown 記録のみ）。

## 入出力・副作用

- 入力: Workers production の状態 / Cloudflare Pages プロジェクト状態 / user 承認文言
- 出力: `outputs/phase-11/` 配下 8 ファイル（main + 7 evidence）
- 副作用: **runtime cycle のみ** Cloudflare Pages プロジェクトの **物理削除**（destructive、revert 不可）

## テスト方針

- 自動テストは追加しない（Cloudflare API destructive 操作のため）。
- 検証は手動 gate: AC-1〜AC-6 のチェックリスト評価。
- redaction 検証は `rg` grep の機械的 0 件確認。

## ローカル実行コマンド

```bash
# spec_created 段階：skeleton 配置（runbook.md に従い実装サイクルで作成）
mkdir -p outputs/phase-11
# 8 ファイルを共通ヘッダーフォーマットで作成

# runtime cycle（user 承認後のみ）
bash scripts/cf.sh whoami
# Workers cutover 確認
# Pages dormant 確認
# ≥ 2 週間観察
bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes   # destructive
# redaction 検証
rg -i "(CLOUDFLARE_API_TOKEN|Bearer |\?token=)" outputs/phase-11/
```

## 完了条件（DoD checklist）

### spec_created 段階（本サイクル）

- [ ] `outputs/phase-11/` 配下に 8 ファイル（main + 7 evidence）の skeleton が実体化
- [ ] 各 skeleton ファイル先頭に共通ヘッダー（state: PENDING_RUNTIME_EXECUTION）が明示
- [ ] 各 evidence file が AC-1〜AC-6 のいずれかに紐付く（`ac_link` 明示）

### runtime cycle 段階（別サイクル / user 承認後）

- [ ] AC-1〜AC-6 全件 PASS
- [ ] dormant 観察期間 ≥ 2 週間が `dormant-period-log.md` に記録
- [ ] user 明示承認が `user-approval-record.md` に記録
- [ ] `bash scripts/cf.sh pages project delete` exit code = 0
- [ ] redaction 検証で grep 0 件
- [ ] 削除後 Workers production smoke = 200 OK
- [ ] `main.md` の `state` が `PASS` に書き換え

## 実行タスク（spec_created）

1. `outputs/phase-11/main.md` skeleton を本仕様の状態記録として配置（実体化は Phase 5 ランブックで実施）。
2. 残り 7 evidence skeleton（preflight / workers-pre-version-id / dormant / approval / deletion / post-smoke / redaction）の declared 内容と AC 紐付けを確定する。
3. 共通ヘッダーフォーマットと redaction ルールを `runbook.md` から参照可能にする。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)
- formalize 元: `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`
- 親仕様 Phase 11 deploy-deferred 契約: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/phase-11.md`

## 成果物

- `outputs/phase-11/main.md`（spec_created でステータス記録のみ。値の埋めは runtime cycle）

## 統合テスト連携

- 自動 runtime テストは存在しない（destructive Cloudflare API 操作のため）。
- 検証は AC マトリクスと redaction grep に集約する。
