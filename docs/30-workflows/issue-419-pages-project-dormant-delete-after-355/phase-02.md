# Phase 2: 設計（観察期間運用 / 削除フロー / evidence schema）

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 02 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| destructiveOperation | true |

## 設計サマリ

5 レイヤで構成する:

1. **CLI ラッパー**: `scripts/cf.sh` の `pages` サブコマンド設計（list / domain / delete）
2. **観察期間運用**: dormant 観察期間の開始 / 終了 / 中間チェック手順と log schema
3. **削除フロー**: preflight → user approval → 削除 → 事後 smoke → redaction の直列フロー
4. **evidence schema**: `outputs/phase-11/` 配下のファイル群と各 schema
5. **aiworkflow-requirements 反映**: Pages 言及箇所の grep 候補一覧と書き換え diff 案

## 1. CLI ラッパー設計

### 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `scripts/cf.sh` | 編集（pages サブコマンド未実装の場合のみ） | `cf.sh pages list` / `cf.sh pages domain <project>` / `cf.sh pages project delete <project>` を追加。内部は `wrangler pages project list` 等を `mise exec --` + `op run --env-file=.env` でラップ |

### サブコマンド signature（概念）

```
bash scripts/cf.sh pages project list
  → wrangler pages project list を op run + mise exec 経由で実行

bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects
  → wrangler pages project list の出力から custom domain attachment を抽出
  （または Cloudflare API GET /accounts/{id}/pages/projects/{name} を curl 経由で取得し domain 抽出）

bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes
  → wrangler pages project delete <project-name> を op run + mise exec 経由で実行
  → exit code 0 を期待
```

> 注: scripts/cf.sh の現行実装に pages サブコマンドが存在しない場合は **Phase 05（実装ランブック）の対象**として追加実装を計画する。実装本体は本仕様書サイクル内では実行しない。

### 副作用

- `pages project list` / `api-get`: read-only
- `pages project delete`: **revert 不可の destructive operation**。user 明示承認後にのみ呼び出す

## 2. 観察期間運用設計

### 観察期間

- 最低 **2 週間**
- 観察開始の前提: Workers cutover 完了 / Pages の最終 deploy が cutover 以前 / Pages active custom domain attachment が空

### 観察項目（中間チェック / 終了時）

| 項目 | 取得方法 | 記録先 |
| --- | --- | --- |
| Workers production 4xx 率 | Cloudflare ダッシュボード or Logpush 集計 | `outputs/phase-11/dormant-period-log.md` |
| Workers production 5xx 率 | 同上 | 同上 |
| Pages dormant 状態維持確認 | `bash scripts/cf.sh pages project list` の最終 deploy timestamp | 同上 |
| Pages active custom domain 不在 | `bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects` | 同上 |
| 異常 incident 有無 | 手動記述 | 同上 |

## 3. 削除フロー設計

直列 6 段階:

1. **Preflight (AC-1 / AC-2)**: Workers cutover 完了 / Pages dormant / custom domain 不在を確認し evidence 取得
2. **VERSION_ID 取得 (NFR-05)**: Workers 前 VERSION_ID を `bash scripts/cf.sh` 経由で取得し記録（rollback 補償）
3. **User Approval (AC-4)**: user 明示承認文言を `outputs/phase-11/user-approval-record.md` および PR description / Issue comment に記録
4. **Delete (AC-4)**: `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` を実行。stdout/stderr を redaction 後に保存
5. **Post-deletion smoke (AC-1)**: Workers production の 200 OK を再確認
6. **Redaction check (AC-5)**: outputs/ 配下を `rg -i "(token|bearer|sink|secret|CLOUDFLARE_API_TOKEN|Authorization)"` で grep し 0 件を確認

## 4. evidence schema 設計

### ディレクトリ構造（`outputs/phase-11/`）

```
outputs/phase-11/
├── main.md
├── preflight-ac1-ac2.md          # AC-1 / AC-2 の preflight evidence
├── dormant-period-log.md          # 開始日 / 中間チェック / 終了日 / 観察結果
├── workers-prev-version-id.md     # NFR-05 補償（redacted）
├── user-approval-record.md        # AC-4 user 明示承認
├── deletion-evidence.md           # 削除コマンド exit code / stdout / stderr（redacted）
├── post-deletion-smoke.md         # AC-1 削除後 Workers smoke
└── redaction-check.md             # AC-5 grep 結果（0 件）
```

### `dormant-period-log.md` schema

```markdown
## dormant 観察期間ログ

- 開始日: YYYY-MM-DD
- 終了日: YYYY-MM-DD（最低 2 週間後）
- Pages プロジェクト名: <project-name>
- 観察開始時 Pages 状態:
  - 最終 deploy: <timestamp>
  - active custom domain: 0 件
- 中間チェック (週次):
  - Week 1 (YYYY-MM-DD): Workers 4xx=X%, 5xx=Y%, Pages dormant 維持=true
  - Week 2 (YYYY-MM-DD): 同上
- 観察結果: <PASS / 異常検出>
- 備考:
```

### `preflight-ac1-ac2.md` schema

```markdown
## Preflight AC-1 / AC-2

### AC-1: Workers cutover 完了
- Workers production route: <redacted URL> → 200 OK 確認 (YYYY-MM-DD HH:MM)
- staging smoke evidence: <親仕様 issue-355 の outputs/phase-11 link>
- production smoke evidence: 同上

### AC-2: Pages active custom domain 不在
- 実行コマンド: `bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects`
- 結果: active domain = 0 件
- 取得時刻: YYYY-MM-DD HH:MM
```

### `deletion-evidence.md` schema

```markdown
## Deletion Evidence

- 実行コマンド: `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes`
- 実行時刻: YYYY-MM-DD HH:MM
- exit code: 0
- stdout (redacted): ...
- stderr (redacted): ...
- 削除実行者: <user reference>
- user 承認 ref: outputs/phase-11/user-approval-record.md
```

### `redaction-check.md` schema

```markdown
## Redaction Check (AC-5)

- 実行コマンド: `rg -i "(token|bearer|sink|secret|CLOUDFLARE_API_TOKEN|Authorization)" docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/`
- 結果: 0 件
- 実行時刻: YYYY-MM-DD HH:MM
```

## 5. aiworkflow-requirements 反映設計

### grep 候補特定（Phase 05 で確定）

```bash
rg -i "Cloudflare Pages|cloudflare-pages|pages\.dev" .claude/skills/aiworkflow-requirements/references/
```

得られたヒット行のうち、本番系で「Pages を deploy 先として記述している箇所」を「削除済み（YYYY-MM-DD）」へ書き換える diff 案を Phase 12 implementation-guide で確定する。

### 変更対象ファイル（候補）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/<該当ファイル>.md` | 編集 | Pages 言及箇所を「削除済み（YYYY-MM-DD）/ Workers cutover 完了済み（Refs #355）」へ書き換え |

> 実際のファイルパス確定は Phase 05 grep gate 後。本 Phase では設計のみ。

## 完了条件（DoD）

- [ ] 5 レイヤすべての変更対象ファイル一覧 / 関数 signature / 入出力 / 副作用が `outputs/phase-02/main.md` に記録されていること
- [ ] evidence schema が AC-1〜AC-6 を網羅していること
- [ ] CLI ラッパーが `bash scripts/cf.sh` 経由のみで構成され、`wrangler` 直接呼び出しが含まれないこと

## 目的

Phase 02 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 02 の入力、実装状態、runtime pending 境界を確認する。
- scripts/cf.sh の現行実装に pages サブコマンドが存在するかを Phase 05 grep で確認する gate を設定する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [phase-01.md](phase-01.md)

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

- redaction grep の dry-run / preflight script の dry-run は Phase 04 / Phase 09 の品質 gate に集約する。
