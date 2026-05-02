# Phase 2: 設計（runbook 構造 + コードアーキテクチャ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 2 |
| 状態 | spec_created |
| taskType | implementation / operations / runbook + scripts |
| 実装区分 | [実装仕様書] |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. F1〜F4 のスクリプト間データフローを確定する。
2. 各スクリプトの引数仕様・stdin/stdout・exit code 規約を表として固定する。
3. evidence の保存スキーマ（meta.json + 3 ログ）を JSON 構造で定義する。
4. CI gate workflow（F6）のジョブ構成と secret 境界を設計する。
5. runbook 章立て（5 セクション）と F1〜F5 の対応表を確定する。
6. 6 段階承認ゲート（G1〜G6）を再掲し、各ゲートと CI gate / scripts の責務を結びつける。

## 目的

Phase 1 で確定した F1〜F9 を、runbook 5 セクションと 6 段階承認ゲートに整合する形で配線する。Phase 4 テスト戦略・Phase 5 runbook 本体・Phase 6 異常系へ橋渡しする。

## 参照資料

- Phase 1 成果物
- `index.md` / `artifacts.json`
- 対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
- 既存 `scripts/cf.sh`
- `apps/api/wrangler.toml`
- 上流 runbook / rollback

## 入力

- F1〜F9 の責務（Phase 1 確定）
- AC-1〜AC-20
- 対象 DB 名（production: `ubm-hyogo-db-prod` / staging: `ubm-hyogo-db-staging`）

## 既存コンポーネント再利用判定

| 観点 | 判定 |
| --- | --- |
| `scripts/cf.sh` | 採用（薄ラッパとして拡張、orchestrator 本体は別ファイル） |
| UT-07B Phase 5 migration-runbook | preflight/apply/post-check 構造を継承 |
| 上流 rollback-runbook | failure handling から参照のみ |
| 新規 Secret | なし（CI gate は staging Token のみ参照） |
| bats-core | 採用（dev 依存として package.json に追加） |

## スクリプト間データフロー

```
[user / CI]
   │
   ▼
scripts/cf.sh d1:apply-prod <db> --env <env>            (F5)
   │ exec
   ▼
scripts/d1/apply-prod.sh <db> --env <env> [DRY_RUN=1]  (F4)
   │
   ├─(1) scripts/d1/preflight.sh <db> --env <env> --json   (F1)
   │       │ stdout = pending migrations JSON
   │       │ exit 0/64/65/66
   │       ▼
   │   pending に 0008_schema_alias_hardening.sql が含まれない → exit 10
   │
   ├─(2) interactive confirm（--env production のみ）
   │       拒否 → exit 20
   │
   ├─(3) DRY_RUN=1 でなければ
   │       bash scripts/cf.sh d1 migrations apply <db> --env <env>
   │       失敗 → exit 30（apply.log は保存）
   │
   ├─(4) scripts/d1/postcheck.sh <db> --env <env>          (F2)
   │       失敗 → exit 40
   │
   └─(5) scripts/d1/evidence.sh <db> --env <env> \         (F3)
           --preflight <tmp> --apply <tmp> --postcheck <tmp>
           redaction NG → exit 80
```

## 引数仕様・exit code 規約（確定版）

| Script | 必須 | オプション | exit code |
| --- | --- | --- | --- |
| F1 preflight.sh | `<db>` `--env` | `--json` | 0/64/65/66 |
| F2 postcheck.sh | `<db>` `--env` | なし | 0/64/70/71/72/73/74 |
| F3 evidence.sh | `<db>` `--env` `--preflight` `--apply` `--postcheck` | なし | 0/64/80/81 |
| F4 apply-prod.sh | `<db>` `--env` | env: `DRY_RUN=1` | 0/10/20/30/40/80 |
| F5 cf.sh d1:apply-prod | `<db>` `--env` | F4 と同じ | F4 を継承 |

すべての script で:

- `set -eu` を有効化、`set -x` は禁止
- `--env` は `staging` | `production` のみ受理（その他は exit 64）
- DB 名は `[a-z][a-z0-9-]+` の正規表現で簡易検証

## evidence 保存スキーマ

`.evidence/d1/<UTC compact ISO8601, e.g. 20260503T091500Z>/`

```
├── meta.json
├── preflight.log
├── apply.log
└── postcheck.log
```

`meta.json`:

```json
{
  "db": "ubm-hyogo-db-prod",
  "env": "production",
  "commit_sha": "<git rev-parse HEAD>",
  "migration_filename": "0008_schema_alias_hardening.sql",
  "timestamp_utc": "2026-05-03T09:15:00Z",
  "timestamp_jst": "2026-05-03T18:15:00+09:00",
  "approver": "<user-supplied or CI=actor>",
  "dry_run": false,
  "exit_code": 0
}
```

### redaction grep 仕様

```
rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|sk-[A-Za-z0-9]+|Bearer [A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\." <evidence dir>
```

ヒット 0 件で PASS、それ以外で exit 80 + 該当ディレクトリ削除。

## CI gate workflow（F6）構成

ファイル: `.github/workflows/d1-migration-verify.yml`

```yaml
name: d1-migration-verify
on:
  pull_request:
    paths:
      - 'apps/api/migrations/**'
      - 'scripts/d1/**'
      - 'scripts/cf.sh'

permissions:
  contents: read

jobs:
  staging-dryrun:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: pnpm install --frozen-lockfile
      - name: bats install
        run: sudo apt-get install -y bats
      - name: unit tests
        run: pnpm test:scripts
      - name: staging DRY_RUN
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN_STAGING }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging
```

production secret は本 workflow で参照禁止（staging 専用）。

## runbook 章立てと F1〜F5 の対応

| # | runbook セクション | 担当 script | exit code を runbook 上で参照 |
| --- | --- | --- | --- |
| 1 | preflight | F1 | 0/65/66 を表で説明 |
| 2 | apply | F4 内部から `cf.sh d1 migrations apply` | F4 exit 30 |
| 3 | post-check | F2 | 0/70-74 を表で説明 |
| 4 | evidence | F3 | 0/80 を表で説明 |
| 5 | failure handling | F4 | 10/20/30/40/80 を全件マッピング |

## 6 段階承認ゲートと scripts/CI の対応

| Gate | 内容 | 自動化 / 手動 | 関連実装 |
| --- | --- | --- | --- |
| G1 commit | 対象 SQL 含む commit | 手動 | - |
| G2 PR | `gh pr create` | 手動 | - |
| G3 CI gate | `d1-migration-verify` で staging DRY_RUN | 自動 | F6 + F1〜F4 + F7 |
| G4 merge | linear merge to main | 手動 | - |
| G5 ユーザー明示承認 | 本番 apply 許可の発話 / PR コメント | 手動 | runbook 冒頭で確認 |
| G6 runbook 実走 | F4 を `--env production` で実行 | 手動 | F5 経由で F4 |

## 不変条件 #5 への影響評価

F1〜F5 は運用コマンド境界で、ランタイム経路を作らない。`apps/web` から D1 直接アクセスは新設しない。post-check は read-only。よって不変条件 #5 は侵害しない。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | データフロー × exit code × runbook 章立てが一対一 |
| 漏れなし | PASS | F1〜F9 が AC-1〜AC-20 を網羅、CI gate と bats でテスト経路網羅 |
| 整合性 | PASS | `cf.sh` 経由のみ・直 wrangler 禁止・staging 限定 secret が CLAUDE.md と整合 |
| 依存関係整合 | PASS | 上流完了、下流（runbook 実走）は本仕様確定後 |

## 完了条件

- [ ] F1〜F4 のデータフロー図が確定
- [ ] 引数仕様・exit code 表が固定
- [ ] evidence 保存スキーマ（meta.json）定義
- [ ] CI gate workflow 構成定義
- [ ] runbook 章立て × F1〜F5 対応表確定
- [ ] 不変条件 #5 影響なし
- [ ] 4 条件評価 PASS

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

bats による単体テストは Phase 4 で詳細化、CI gate 上で `pnpm test:scripts` として実行。production 実 apply は本仕様外。
