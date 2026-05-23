# Issue #331 Follow-up 002 Cloudflare Pages Project Physical Deletion - タスク指示書

> Consumed / superseded on 2026-05-14 by `docs/30-workflows/issue-639-cloudflare-pages-project-physical-deletion/`.
> This file is retained as source trace only. Current execution planning, Gate A / Gate C separation, and Phase 12 strict outputs live in the Issue #639 workflow root.

## メタ情報

```yaml
issue_number: TBD
task_id: issue-331-followup-002-cloudflare-pages-project-physical-deletion
task_name: Issue #331 Follow-up 002 Cloudflare Pages Project Physical Deletion
category: 改善
target_feature: Cloudflare Pages project retirement (apps/web Workers cutover follow-up)
priority: 低
scale: 小規模
status: consumed_by_issue_639_workflow
source_phase: docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-09
dependencies:
  - issue-331-followup-001-cloudflare-pages-project-var-deletion
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `issue-331-followup-002-cloudflare-pages-project-physical-deletion` |
| タスク名 | Issue #331 Follow-up 002 Cloudflare Pages Project Physical Deletion |
| 分類 | 改善 |
| 対象機能 | Cloudflare Pages project retirement (apps/web Workers cutover follow-up) |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | consumed / superseded by `docs/30-workflows/issue-639-cloudflare-pages-project-physical-deletion/` |
| 発見元 | `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-09 |
| source issue | Issue #331 (MERGED; use `Refs #331` only) |
| taskType | runtime / external-mutation |
| visualEvidence | NON_VISUAL |
| dependencies | `issue-331-followup-001-cloudflare-pages-project-var-deletion` (順序: variable 削除 → project 削除) |
| earliest execution date | dormant 観察期間 30 日経過後（最短 2026-06-08） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #331（CI/CD runtime warning cleanup）で `.github/workflows/web-cd.yml` を `pages deploy` から `scripts/cf.sh deploy --config apps/web/wrangler.toml` （Workers deploy）に統一した。これにより staging / production の `apps/web` deploy は Cloudflare Workers にカットオーバーされ、Cloudflare Pages 側の project（少なくとも staging、場合により production も）は **dormant** 状態になった。

ADR-0001（`docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`）は `apps/web` の deploy target を Workers に統一する方針を 2026-05-01 に採択し、2026-05-09 時点で repo-side cutover が完了している。Cloudflare side の Pages project retirement は user-gated AC として残されている。

当初は Issue #419（Pages dormant cleanup after #355）に fold する想定だったが、Issue #419 は既に CLOSED のため、本件を独立した tracking unit として未タスク化する。

### 1.2 問題点・課題

- dormant な Cloudflare Pages project を放置すると以下のリスクが残る:
  - **cost**: Pages 自体は従量無料枠だが、紐付く R2 / KV / Functions の shared resource があると課金面で誤計上される可能性
  - **名前空間競合**: 同名 project を将来再利用する際、dormant project が name 衝突を起こす
  - **セキュリティ surface**: dormant deploy URL（`*.pages.dev`）が live のまま放置されると、古い build artifact が公開され続ける
- Issue #419 で同種の対応が先行クローズされており、本件の owner gap が発生している

### 1.3 放置した場合の影響

- Cloudflare account 上に "dormant だが live URL を持つ" Pages project が残り、Workers 統一の事実と乖離した状態が観測される
- 将来 Pages project の再作成が必要になった際に名前空間が取れない
- 旧 Pages deploy の build artifact が `*.pages.dev` で indexable な状態のまま残る

---

## 2. 何を達成するか（What）

### 2.1 目的

Issue #331 で Workers deploy に統一した結果 dormant 化した Cloudflare Pages project（staging、および production に存在する場合）を物理削除し、`web-cd.yml` および関連 spec から Pages 系 rollback path 記述を完全に除去する。

### 2.2 最終ゴール

- staging Pages project が Cloudflare dashboard / API 上から消失している
- production Pages project が存在していた場合は同様に消失している
- 旧 deploy URL（`*.pages.dev`）が 404 を返す
- `.github/workflows/web-cd.yml` から Pages 関連の rollback path 記述・コメントが完全削除されている
- 削除前の最終 deploy snapshot（`wrangler pages deployment list` 結果）が evidence として保存されている

### 2.3 スコープ

#### 含むもの

- `bash scripts/cf.sh pages project list` による現状確認（ラッパー未対応の場合は `wrangler pages project list` を許容例外として使用）
- dormant 期間（推奨 30 日）経過の確認
- `wrangler pages project delete <project-name>` の実行
- 削除後の `*.pages.dev` deploy URL 404 確認
- 削除前の最終 deploy snapshot の取得・保存
- `web-cd.yml` の Pages 関連 rollback path 記述削除（差分が必要な場合）

#### 含まないもの

- `CLOUDFLARE_PAGES_PROJECT` repository variable の削除（dependency: `issue-331-followup-001` で先行実施）
- OIDC / step-scoped `CF_TOKEN_*` cutover（別 workstream）
- D1 / R2 / KV など Workers 側 binding の変更
- Issue #331 / #419 の reopen / close

### 2.4 成果物

- 後続 workflow の `outputs/phase-11/cf-pages-project-list-before.json`（削除前 project 一覧）
- 後続 workflow の `outputs/phase-11/cf-pages-deployment-snapshot-<project>.json`（削除前最終 snapshot）
- 後続 workflow の `outputs/phase-11/cf-pages-project-list-after.json`（削除後 project 一覧）
- 後続 workflow の `outputs/phase-11/pages-dev-url-404-check.md`（404 確認ログ）
- 後続 workflow の `outputs/phase-12/system-spec-update-summary.md`
- `.github/workflows/web-cd.yml` から Pages rollback path 記述が削除された差分（必要な場合のみ）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- dependency `issue-331-followup-001-cloudflare-pages-project-var-deletion` が完了し、`CLOUDFLARE_PAGES_PROJECT` repository variable が削除済みであること（順序的に variable 削除 → project 削除が安全）
- Issue #331 の Workers cutover 完了から **dormant 観察期間 30 日** が経過していること（最短 2026-06-08）
- Workers staging / production smoke が green で観測されていること
- `scripts/cf.sh` 経由で Cloudflare API token が 1Password から動的注入できること

### 3.2 依存タスク

- 先行: `issue-331-followup-001-cloudflare-pages-project-var-deletion`
- 参照: `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md`
- 参照: `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`
- 参照: `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/`（CLOSED 済み・参考のみ）

### 3.3 必要な知識

- Cloudflare Pages project の不可逆削除特性（削除後復元不能）
- `wrangler pages project list` / `wrangler pages deployment list` / `wrangler pages project delete` の挙動
- `scripts/cf.sh` ラッパー経由での Cloudflare CLI 実行原則（CLAUDE.md 必読セクション）

### 3.4 推奨アプローチ

1. **事前確認**: `bash scripts/cf.sh pages project list`（または許容例外として `wrangler pages project list`）で現状の Pages project を列挙し、staging / production それぞれの dormant 状態を確認
2. **snapshot 取得**: 削除対象 project ごとに `wrangler pages deployment list --project-name=<name>` の結果を JSON で保存（rollback path 用 evidence）
3. **dormant 経過確認**: 最終 deployment 日時から 30 日経過していることを確認
4. **削除実行**: `wrangler pages project delete <project-name>` を staging → production の順に実行（production が存在する場合のみ）
5. **404 確認**: 削除後 `curl -I https://<project>.pages.dev/` で 404 を確認
6. **差分削除**: `web-cd.yml` に残っている Pages 関連 rollback path 記述を削除

> **重要**: Cloudflare Pages project 削除は**不可逆**である。snapshot 取得と dormant 経過確認を必ず削除前に完了させること。

---

## 4. 実行手順

### Phase構成

1. Phase 1: 事前確認 と snapshot 取得
2. Phase 2: dormant 経過判定
3. Phase 3: project 削除実行
4. Phase 4: 削除後検証 と spec 同期

### Phase 1: 事前確認 と snapshot 取得

#### 目的

削除対象 Pages project の現状と最終 deploy snapshot を evidence として保存する。

#### 手順

1. `bash scripts/cf.sh pages project list` を実行（ラッパー未対応の場合は `wrangler pages project list` を allowed exception として使用、その旨を evidence に明記）
2. staging / production それぞれの project name と最終 deployment 日時を記録
3. 削除対象 project ごとに `wrangler pages deployment list --project-name=<name>` を JSON 保存
4. dependency (`issue-331-followup-001`) で `CLOUDFLARE_PAGES_PROJECT` 変数が削除済みであることを `gh variable list` で確認

#### 成果物

- `outputs/phase-11/cf-pages-project-list-before.json`
- `outputs/phase-11/cf-pages-deployment-snapshot-<project>.json`

#### 完了条件

- 削除対象 project ごとに snapshot が保存されている
- dependency 完了が evidence として記録されている

### Phase 2: dormant 経過判定

#### 目的

不可逆削除の前提として dormant 観察期間が満たされているかを判定する。

#### 手順

1. snapshot から各 project の最終 deployment 日時を抽出
2. 最終 deployment 日時から 30 日経過しているか判定
3. Workers staging / production smoke が同期間 green であることを確認
4. 30 日未満なら本タスクを終了し、再開予定日を記録

#### 成果物

- `outputs/phase-11/dormant-window-decision.md`

#### 完了条件

- 30 日経過 PASS が記録されている、または再開予定日が記録されている

### Phase 3: project 削除実行

#### 目的

dormant Pages project を物理削除する。

#### 手順

1. staging project に対し `wrangler pages project delete <staging-project-name>` を実行
2. production project が存在する場合は同様に削除
3. 実行ログを保存

#### 成果物

- `outputs/phase-11/cf-pages-project-delete-log.md`

#### 完了条件

- 削除コマンドが exit 0 で完了している

### Phase 4: 削除後検証 と spec 同期

#### 目的

削除完了を multi-source で検証し、`web-cd.yml` 等から Pages rollback path 記述を除去する。

#### 手順

1. `bash scripts/cf.sh pages project list` で削除対象が消失していることを確認
2. `curl -I https://<project>.pages.dev/` で各 deploy URL が 404 を返すことを確認
3. `.github/workflows/web-cd.yml` を grep し、Pages 関連の rollback path 記述・コメントが残っていないか確認、残っていれば削除
4. `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` の "Cloudflare side: Pages project retirement" を「完了」に更新
5. `outputs/phase-12/system-spec-update-summary.md` に同期対象を記録

#### 成果物

- `outputs/phase-11/cf-pages-project-list-after.json`
- `outputs/phase-11/pages-dev-url-404-check.md`
- `.github/workflows/web-cd.yml`（差分が必要な場合）
- `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`（status 更新）
- `outputs/phase-12/system-spec-update-summary.md`

#### 完了条件

- after-list に対象 project が含まれない
- 全 deploy URL が 404
- `web-cd.yml` から Pages rollback path 記述が完全削除

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] staging Pages project が Cloudflare dashboard / API から消失している
- [ ] production Pages project が存在していた場合は同様に消失している
- [ ] 旧 deploy URL（`*.pages.dev`）が 404 を返す
- [ ] `.github/workflows/web-cd.yml` から Pages 関連 rollback path 記述が完全削除されている

### 品質要件

- [ ] 削除前の最終 deployment snapshot が JSON で保存されている
- [ ] dormant 30 日経過が evidence で確認されている
- [ ] dependency (`issue-331-followup-001`) 完了が evidence で確認されている
- [ ] `scripts/cf.sh` 経由で実行されている（許容例外時は明記）

### ドキュメント要件

- [ ] `outputs/phase-11/dormant-window-decision.md` が記録されている
- [ ] `outputs/phase-11/cf-pages-project-delete-log.md` が記録されている
- [ ] ADR-0001 の Cloudflare side retirement status が更新されている
- [ ] `outputs/phase-12/system-spec-update-summary.md` に正本同期対象が記録されている

---

## 6. 検証方法

### テストケース

- 削除前: project list に対象が含まれる
- 削除後: project list から対象が消失している
- 削除後: `*.pages.dev` URL が HTTP 404
- repo: `web-cd.yml` に Pages 関連記述が残らない

### 検証手順

```bash
# 削除前
bash scripts/cf.sh pages project list > outputs/phase-11/cf-pages-project-list-before.json
wrangler pages deployment list --project-name=<staging-project> > outputs/phase-11/cf-pages-deployment-snapshot-staging.json

# 削除
wrangler pages project delete <staging-project>

# 削除後
bash scripts/cf.sh pages project list > outputs/phase-11/cf-pages-project-list-after.json
curl -I https://<staging-project>.pages.dev/ | tee -a outputs/phase-11/pages-dev-url-404-check.md

# repo grep
grep -nE 'pages[ _-]?(deploy|project)' .github/workflows/web-cd.yml || echo "OK: no Pages rollback path"
```

期待: before-list には対象 project が含まれ、after-list には含まれない。`*.pages.dev` は HTTP/2 404。`web-cd.yml` grep は no-match。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| Pages project 削除は不可逆で復元不能 | 高 | 低 | 削除前に dormant 30 日経過と最終 deployment snapshot を必ず evidence 化する |
| `scripts/cf.sh` ラッパーが Pages 系 subcommand を完全カバーしていない | 中 | 中 | 事前確認し、未対応なら `wrangler pages ...` を allowed exception として明記、または scripts/cf.sh を拡張する |
| Issue #419 の closed と同様、本件も完了後に owner gap が再発する | 中 | 低 | 完了 issue でも tracking が必要な deferred は新規 issue を切り直す原則を本タスクで明文化する |
| variable 削除（dependency）未完で project 削除すると `web-cd.yml` の変数参照が残存し、後続の guard CI が誤検知 | 中 | 中 | dependency の `CLOUDFLARE_PAGES_PROJECT` 削除完了を Phase 1 evidence で必須化する |
| production Pages project の存在を見落として staging のみ削除 | 中 | 中 | Phase 1 で project list 全件を evidence 化し、production / staging 両方の dormant 状態を必ず判定する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md`（フォーマット参考）
- `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`
- `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/`（CLOSED・参考）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`

### 参考資料

- Cloudflare Wrangler Pages API: `wrangler pages project list|delete`、`wrangler pages deployment list`
- `scripts/cf.sh` ラッパー（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | Issue #331 の Workers cutover 完了後、dormant 化した Cloudflare Pages project の物理削除 owner が宙に浮いた |
| 原因 | 当初 fold 先と想定していた Issue #419 が既に CLOSED で、Issue #331 単独では Cloudflare side の external mutation を抱えきれず Phase-12 で deferred 化された |
| 対応 | 独立した未タスクとして本仕様書を作成し、dependency (`issue-331-followup-001` variable 削除) と dormant 30 日観察を経て削除する手順を明文化した |
| 再発防止 | 完了 issue でも tracking が必要な deferred items は、fold 先 issue の状態（OPEN/CLOSED）を必ず確認し、CLOSED の場合は新規 unassigned task を切り直す原則を運用ルール化する |
| 参照 | `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/outputs/phase-12/unassigned-task-detection.md` |

### レビュー指摘の原文（該当する場合）

該当なし。Issue #331 Phase-12 unassigned-task-detection.md の deferred items 3 件のうち、Pages project 物理削除分を formalize したもの。

### 補足事項

- Phase 13 の commit / PR / push はユーザー承認ゲートであり、本タスクの作成時点では実行しない
- Cloudflare Pages project 削除は**不可逆**である。dormant 観察期間と snapshot 取得を skip しないこと
- `scripts/cf.sh` ラッパーが Pages 系 subcommand に未対応の場合、`wrangler pages ...` 直接実行を allowed exception として記録する（CLAUDE.md の `wrangler` 直接呼び出し禁止原則の唯一の例外運用）
