# Phase 6: production D1 migration 適用

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-09c-production-deploy-execution-001 |
| Phase 番号 | 6 / 13 |
| Phase 名称 | production D1 migration 適用 |
| Wave | 9 |
| Mode | serial（最終 / production mutation の execution 半身） |
| 作成日 | 2026-05-02 |
| 前 Phase | 5 (preflight 実行 + user 承認 1 回目) |
| 次 Phase | 7 (production deploy 実行 / API / Web) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| user_approval | REQUIRED（Phase 5 GO の継続有効性に依存。再承認は不要だが NO-GO 後は本 Phase 起動禁止） |

## 目的

Phase 5 で取得した preflight evidence と user GO に基づき、production D1 (`ubm_hyogo_production`) に対して **migration を適用**する。
適用前に backup を取得し、適用後に list 再実行で全件 `Applied` を確認する。失敗時は backup からの復旧経路を明示する。

## 実行タスク

1. production D1 backup（適用前 / `bash scripts/cf.sh d1 export`）
2. 未適用 migration の確認（`bash scripts/cf.sh d1 migrations list ... --remote`）
3. migration apply（`bash scripts/cf.sh d1 migrations apply ... --remote`）
4. 適用後 list 再実行で全件 `Applied` 確認
5. backup ファイルパスの記録（リポジトリ commit 禁止 / ローカル only）
6. 失敗時 rollback 経路の準備（migration revert SQL or backup restore）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC-4 / AC-13 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-05.md | preflight evidence + GO log |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md | 親 runbook Step 3〜5（backup / list / apply） |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | D1 migration 正本（後方互換 fix migration の方針） |
| 必須 | scripts/cf.sh | Cloudflare CLI wrapper |

## 実行手順

### ステップ 1: production D1 backup

```bash
TS=$(date +%Y%m%d-%H%M)
bash scripts/cf.sh d1 export ubm_hyogo_production \
  --remote \
  --output="backup-pre-migrate-${TS}.sql" \
  --env production \
  --config apps/api/wrangler.toml
ls -la "backup-pre-migrate-${TS}.sql"
# expected: ファイルサイズ > 0
```

- evidence 保存先: `outputs/phase-06/d1-backup.sql.path.md` に **絶対パス + サイズ + sha256** を記録
- 注意: backup `.sql` 本体は **リポジトリに commit 禁止**（ローカル only）
- 対応 AC: AC-12 の事前条件（rollback 用 payload 確保）

### ステップ 2: 未適用 migration 確認

```bash
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
```

- evidence 保存先: `outputs/phase-06/d1-migration-evidence.md` の "適用前 list" セクション
- 期待: 未適用件数 0 か、未適用ファイル名が明示される
- 対応 AC: AC-4 の事前確認

### ステップ 3: migration apply

```bash
bash scripts/cf.sh d1 migrations apply ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
# expected: 適用件数が表示、エラーなし、exit 0
```

- evidence 保存先: `outputs/phase-06/d1-migration-evidence.md` の "apply 出力" セクション
- 対応 AC: AC-4

### ステップ 4: 適用後 list 再実行

```bash
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote \
  --env production \
  --config apps/api/wrangler.toml
# expected: 全 migration が Applied
```

- evidence 保存先: `outputs/phase-06/d1-migration-evidence.md` の "適用後 list" セクション
- 対応 AC: AC-4

### ステップ 5: 失敗時 rollback 経路の明示

| 失敗ケース | 検出 | 復旧経路 |
| --- | --- | --- |
| apply 中に SQL エラー | apply の stderr / exit 非 0 | 1) 当該 migration の revert SQL を `bash scripts/cf.sh d1 execute ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml --command "..."` で適用、2) backup restore は **最終手段** |
| apply は通ったが起動後不整合 | Phase 9 smoke で 5xx | 後方互換 fix migration を新規追加し再 apply（spec/15 「緊急 SQL 直打ち禁止 / 後方互換 fix migration を採る」方針） |
| backup restore が必要な致命障害 | 上記でも復旧不能 | backup `.sql` を `bash scripts/cf.sh d1 execute ... --file=backup-pre-migrate-${TS}.sql` で投入。**user 再承認必須**（Phase 5 GO の射程外） |

- 注意: rollback 実行時は **必ず Phase 11 incident 経路** に切り替え、`outputs/phase-11/incident-log.md` を作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | preflight `D1 migrations list` と本 Phase の "適用前 list" が整合 |
| Phase 7 | migration 適用後の schema 前提で API/Web を deploy |
| Phase 9 | smoke で 5xx 多発時に migration を疑い本 Phase に差し戻し |
| Phase 11 | 24h メトリクスで D1 writes 急増時、本 Phase の差分を確認 |

## 多角的チェック観点（不変条件）

- #4: migration が `apps/web` 経路で実行されないこと（D1 access は API 側のみ）
- #5: 本 Phase は API 経路から D1 を操作。`apps/web` 側に D1 binding を増やさない
- #10: backup / apply 1 回ずつのみ。reads / writes は microscale で無料枠影響なし
- #11: 本 Phase で admin UI 操作は行わない
- #15: attendance unique 制約 / `deleted_at IS NULL` 不変条件は migration 後も保持されること（Phase 11 で SQL 再確認）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | D1 backup | 6 | pending | `cf.sh d1 export` |
| 2 | 適用前 list | 6 | pending | 未適用差分確認 |
| 3 | migration apply | 6 | pending | `cf.sh d1 migrations apply` |
| 4 | 適用後 list | 6 | pending | 全件 Applied 確認 |
| 5 | rollback 経路明示 | 6 | pending | revert SQL / backup restore |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/d1-migration-evidence.md | 適用前 list / apply 出力 / 適用後 list |
| ドキュメント | outputs/phase-06/d1-backup.sql.path.md | backup ファイルの絶対パス + size + sha256（本体は commit せず） |
| メタ | artifacts.json | Phase 6 を completed に更新 |

## 完了条件

- [ ] backup ファイルが生成され、サイズ > 0、sha256 を `d1-backup.sql.path.md` に記録
- [ ] 適用後 list で全 migration が `Applied`
- [ ] apply / list の stdout がそのまま `d1-migration-evidence.md` に転記（差し替え禁止）
- [ ] backup `.sql` 本体がリポジトリにステージされていない（`git status -s | grep '\.sql$'` が空）
- [ ] 全 Cloudflare コマンドが `bash scripts/cf.sh` 経由（AC-13）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- d1-migration-evidence.md / d1-backup.sql.path.md 配置済み
- 適用後 list が全件 Applied で AC-4 PASS
- artifacts.json の phase 6 を completed に更新

## 次 Phase

- 次: 7 (production deploy 実行 / API / Web)
- 引き継ぎ事項: 適用後 schema が Phase 7 deploy 対象 commit と整合していること
- ブロック条件: 適用後 list に未 Applied が残る / apply が exit 非 0

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| migration apply が中途で失敗 | schema 不整合 | revert SQL を即時 apply。それでも復旧不能なら backup restore（user 再承認必須） |
| backup `.sql` が誤って commit | 個人情報 / 本番 schema 漏洩 | `.gitignore` に `backup-*.sql` 既存確認、commit 前に `git status -s` で `.sql` が無いこと確認 |
| backup `.sql` 紛失 | rollback 不能 | path.md に絶対パス + sha256 を記録、ローカル安全領域へ保管 |
| `wrangler` 直実行混入 | AC-13 違反 | 全コマンド `bash scripts/cf.sh` 経由 |
| 適用後 Phase 7 deploy 前に新 commit が main に入る | schema と code の乖離 | Phase 7 開始時に再度 `git rev-parse origin/main` を Phase 5 evidence と照合 |
| **rollback 経路の中で AI が値を貼り付ける** | secret 漏洩 | rollback 実行時も backup path のみ参照、SQL 値は output しない |
