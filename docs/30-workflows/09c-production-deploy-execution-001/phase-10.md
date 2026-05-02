# Phase 10: GO/NO-GO 判定（G3 user 承認）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-production-deploy-execution-001 |
| Phase 番号 | 10 / 13 |
| Phase 名称 | GO/NO-GO 判定 + G3 user 承認 |
| Wave | 9 (execution 半身) |
| Mode | serial（最終 / production mutation） |
| 作成日 | 2026-05-02 |
| 前 Phase | 9 (production smoke + 認可境界検証) |
| 次 Phase | 11 (24h post-release 検証 + 共有) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | VISUAL（GO/NO-GO 判定書 / user 承認ログ）|
| user_approval | **REQUIRED（G3 / 24h verification 開始 or rollback の判定 gate）** |

## 目的

Phase 5 の preflight 承認（G2）と Phase 6-9 の deploy / smoke 結果を総合し、Phase 11 の 24h post-release 検証へ進むか、rollback / incident runbook 起動へ分岐するかを **user 明示承認 G3** で確定する。本タスクの production approval は Phase 1 / Phase 5 / Phase 10 の三段ゲート（G1/G2/G3）で完結する。Phase 13 の PR 作成承認は GitHub 操作の承認であり、production mutation approval には数えない。

NO-GO 判定時は API / Web の VERSION_ID を用いた `bash scripts/cf.sh rollback` 手順、release tag 削除手順、09b incident response runbook 起動を本 Phase で記録し、復旧 evidence を残す。

## 実行タスク

1. AC-1〜13 の達成状況を 1 ページ matrix に集約
2. Phase 6-9 の smoke / 認可境界 / 不変条件再確認の結果サマリを作成
3. GO 判定 / NO-GO 判定の判定基準を確定し、いずれかを選択
4. **user 明示承認ゲート（G3）** を提示し、承認ログを保存
5. GO 判定 → Phase 11 着手準備（24h 観測 baseline 設定）
6. NO-GO 判定 → rollback 実行記録 + incident runbook 起動 + 関係者共有
7. 判定 evidence を `outputs/phase-10/` に保存

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-10.md | GO/NO-GO 判定基準の正本 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC-1〜13 一覧 |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-05.md | 1 回目承認ログ |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-07.md | deploy evidence / VERSION_ID |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-08.md | `RELEASE_TAG` |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-09.md | smoke / authz / screenshots |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | rollback procedures + incident runbook |
| 必須 | scripts/cf.sh | rollback 実行 wrapper |
| 参考 | CLAUDE.md | user_approval 運用ポリシー |

## 実行手順

### ステップ 1: AC-1〜13 status matrix 作成

`outputs/phase-10/ac-status-matrix.md` に以下を記録:

| AC | 内容（要約） | 達成状況 | evidence path |
| --- | --- | --- | --- |
| AC-1 | user approval G1/G2/G3 ログ保存 | TBD | outputs/phase-01/, phase-05/, phase-10/ |
| AC-2 | main commit と deploy 対象一致 | TBD | outputs/phase-07/deploy-evidence.md |
| AC-3 | cf.sh whoami が production 一致 | TBD | outputs/phase-05/preflight-evidence.md |
| AC-4 | D1 migrations Applied | TBD | outputs/phase-06/d1-migration-evidence.md |
| AC-5 | secrets 7 種存在 | TBD | outputs/phase-05/preflight-evidence.md |
| AC-6 | api / web deploy exit 0 | TBD | outputs/phase-07/deploy-evidence.md |
| AC-7 | 10 ページ + 認可境界 smoke PASS | TBD | outputs/phase-09/smoke-evidence.md |
| AC-8 | release tag 付与 + push | TBD | outputs/phase-08/release-tag-evidence.md |
| AC-9 | incident runbook 共有 evidence | Phase 11 で確定 | outputs/phase-11/share-evidence.md |
| AC-10 | 24h Cloudflare Analytics 実測 | Phase 11 で確定 | outputs/phase-11/24h-metrics.md |
| AC-11 | 不変条件 #4/#5/#10/#11/#15 production 再確認 | TBD | outputs/phase-09/smoke-evidence.md |
| AC-12 | 異常時 rollback or 異常なし evidence | 本 Phase で確定 | outputs/phase-10/go-no-go.md |
| AC-13 | wrangler 直実行 0 件 | TBD | outputs/phase-09/smoke-evidence.md |

Phase 10 時点で達成必須: AC-1〜8, AC-11, AC-13。AC-9 / AC-10 は Phase 11 で確定、AC-12 は本 Phase の判定結果で確定。

### ステップ 2: smoke / 認可境界 / 不変条件サマリ

`outputs/phase-10/go-no-go.md` の前段に以下を集約:

- smoke matrix 結果（30 セル PASS 数 / FAIL 数 / 内訳）
- API smoke 4 ケースの HTTP status
- 不変条件 #4 / #5 / #11 / #15 production 再確認結果
- 不変条件 #10（無料枠）は smoke 時点の Workers req 観測値（24h 確定は Phase 11）
- D1 migration / secrets / deploy / release tag の各 evidence の有無

### ステップ 3: GO/NO-GO 判定基準

| 軸 | GO 条件 |
| --- | --- |
| AC-1 | Phase 1 / Phase 5 の承認ログが保存済み |
| AC-2 | deploy commit = main HEAD |
| AC-3 | cf.sh whoami が production account |
| AC-4 | D1 migrations 全 Applied |
| AC-5 | secrets 7 種登録済 |
| AC-6 | api / web deploy 双方 exit 0 |
| AC-7 | smoke matrix 30 セル全 PASS、API smoke 4 ケース PASS |
| AC-8 | release tag 付与 + remote 反映済 |
| AC-11 | 不変条件 #4 / #5 / #11 / #15 production 再確認 PASS |
| AC-13 | wrangler 直実行 0 件 |

10 軸全て PASS → **GO 判定** → user 承認 2 回目 gate へ。
1 軸でも FAIL → **NO-GO 判定** → ステップ 6 へ。

### ステップ 4: user 明示承認ゲート（G3）

GO 判定の場合、以下のテンプレートを user に提示し、承認を得る:

```text
[ APPROVAL REQUIRED - PRODUCTION DEPLOY GATE G3/3 ]
Wave: 9 (execution 半身)
Task: 09c-production-deploy-execution-001
Phase: 10 (GO/NO-GO 判定)

GO 判定軸: 10/10 PASS
RELEASE_TAG: <Phase 8 確定値>
RELEASE_COMMIT: <Phase 7 deploy 対象 commit>
api VERSION_ID: <Phase 7 evidence>
web VERSION_ID: <Phase 7 evidence>

smoke matrix: 30/30 PASS
API smoke: 4/4 PASS
不変条件 #4/#5/#11/#15: 4/4 PASS production 再確認
wrangler 直実行: 0 件

次フェーズ着手時の影響:
  - Phase 11 で 24h post-release 検証を開始
  - Cloudflare Analytics dashboard で Workers req / D1 reads / writes を 24h 観測
  - 観測中は新規 deploy 凍結（incident hotfix 例外のみ）
  - incident response runbook を関係者へ共有

24h 検証開始を承認しますか？ [y/N]
```

承認ログを `outputs/phase-10/user-approval-log.md` に追記:

```yaml
gate: G3/3
phase: 10
timestamp_jst: <YYYY-MM-DD HH:MM:SS+09:00>
approver: <user 識別子>
decision: APPROVED | REJECTED
release_tag: <vYYYYMMDD-HHMM>
remarks: <任意メモ>
```

**未承認 / REJECTED の場合は Phase 11 に絶対に進まない**。REJECTED の場合は本 Phase で NO-GO に切り替えてステップ 6 へ。

### ステップ 5: GO 判定 → Phase 11 着手準備

```bash
# 24h 観測 baseline 取得（Cloudflare Analytics の起点時刻を記録）
echo "observation_window_start_jst=$(TZ=Asia/Tokyo date +'%Y-%m-%dT%H:%M:%S+09:00')"
```

baseline を `outputs/phase-10/go-no-go.md` に追記し、Phase 11 で `+24h` 経過確認の起点とする。

### ステップ 6: NO-GO 判定 → rollback 実行

NO-GO の場合、以下を本 Phase 内で完結させる:

#### 6-1. rollback 実行（API / Web）

```bash
# Phase 7 evidence から VERSION_ID を取得
API_VERSION_ID="<Phase 7 で記録した直前 stable version>"
WEB_VERSION_ID="<同上 web>"

# API rollback
bash scripts/cf.sh rollback "${API_VERSION_ID}" \
  --config apps/api/wrangler.toml --env production

# Web rollback
bash scripts/cf.sh rollback "${WEB_VERSION_ID}" \
  --config apps/web/wrangler.toml --env production
```

期待: 双方 exit 0、Cloudflare dashboard で previous version への切替を確認。

#### 6-2. release tag 削除

```bash
git tag -d "${RELEASE_TAG}"
git push origin --delete "${RELEASE_TAG}"
```

immutable 規則: 削除のみ。上書き禁止。再 deploy 時は別 HHMM で発行。

#### 6-3. incident response runbook 起動

09b 成果物の `incident-response-runbook.md` に従い、関係者共有・原因究明・hotfix 計画を実行。共有 evidence を `outputs/phase-10/incident-share-evidence.md` に保存（Phase 11 の AC-9 共有とは別軸）。

#### 6-4. NO-GO 評価記録

`outputs/phase-10/go-no-go.md` の最終セクションに記録:

- NO-GO 軸（どの AC が FAIL か）
- rollback 実行ログ（API / Web の VERSION_ID と切替後 status）
- 削除した `RELEASE_TAG`
- incident runbook 起動時刻
- 復旧後 smoke の再実行有無（必要に応じて Phase 9 へ差し戻し）
- 後続 task spec として起票するか判定（runbook 不備が原因の場合は unassigned-task に起票）

### ステップ 7: 判定 evidence 保存

`outputs/phase-10/go-no-go.md` を最終形に整え、以下を含める:

- 判定: GO | NO-GO
- 判定根拠（10 軸表 + smoke サマリ）
- user 承認 G3 ログ（GO 時）/ REJECTED 経緯（NO-GO 時）
- rollback / incident 実行記録（NO-GO 時のみ）
- 24h 観測 baseline（GO 時のみ）
- AC-12（異常時 rollback or 異常なし evidence）の確定内容

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定 + 承認 G3 後に 24h 検証実施 / NO-GO 時は Phase 11 不実行 |
| Phase 12 | go-no-go.md / ac-status-matrix.md を implementation guide に取り込み |
| Phase 13 | PR body に GO/NO-GO 判定結果と user 承認ログ参照を含める |
| 上流 09b | NO-GO 時に incident response runbook を消費 |

## 多角的チェック観点（不変条件）

- user 承認 G3 が未取得のまま Phase 11 に進めない gate 設計
- 不変条件 #4 / #5 / #10 / #11 / #15 を AC-11（smoke 再確認）と本 Phase 判定で 2 重に確認
- Cloudflare CLI: rollback も `bash scripts/cf.sh` 経由のみ（AC-13 維持）
- release tag 削除時も immutable 規則を守る（上書き禁止 / 削除 + 別名再発行）
- NO-GO 判定の rollback evidence と GO 判定の baseline が混在しないよう evidence ファイルを分離

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC status matrix 作成 | 10 | pending | 13 行表 |
| 2 | smoke / 不変条件サマリ集約 | 10 | pending | go-no-go.md 前段 |
| 3 | GO/NO-GO 判定 | 10 | pending | 10 軸 |
| 4 | **user 承認 G3 ゲート** | 10 | pending | **必須 / blocked until approval** |
| 5 | GO: 24h baseline 設定 | 10 | pending | GO 時のみ |
| 6 | NO-GO: rollback 実行 | 10 | pending | NO-GO 時のみ / cf.sh 経由 |
| 7 | NO-GO: release tag 削除 | 10 | pending | NO-GO 時のみ |
| 8 | NO-GO: incident runbook 起動 | 10 | pending | NO-GO 時のみ |
| 9 | 判定 evidence 保存 | 10 | pending | go-no-go.md / user-approval-log.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定書 + 根拠 + rollback 記録（NO-GO 時）|
| ドキュメント | outputs/phase-10/ac-status-matrix.md | AC-1〜13 達成状況 matrix |
| ドキュメント | outputs/phase-10/user-approval-log.md | user 承認 G3 ログ |
| ドキュメント | outputs/phase-10/incident-share-evidence.md | NO-GO 時のみ |
| メタ | artifacts.json | Phase 10 を completed に更新 |

## 完了条件

- [ ] AC-1〜8, AC-11, AC-13 の達成状況が確定
- [ ] GO または NO-GO のいずれかを明示判定
- [ ] GO の場合: user 承認 G3 ログが保存
- [ ] GO の場合: 24h 観測 baseline 時刻が記録
- [ ] NO-GO の場合: rollback 実行ログ + release tag 削除ログ + incident runbook 起動記録が保存
- [ ] AC-12 が「異常なし evidence」または「rollback 実行記録」のいずれかで確定

## タスク100%実行確認【必須】

- 全実行タスクが completed
- GO 判定 + user 承認 G3 → Phase 11 へ
- NO-GO 判定 → Phase 11 不実行、rollback + incident まで完了
- user 未承認 / REJECTED の場合は Phase 11 に進まない（**24h 検証着手の最終 gate**）
- artifacts.json の phase 10 を completed に更新

## 次 Phase

- 次: 11 (24h post-release 検証 + 共有) ※GO 判定 + 承認時のみ
- 引き継ぎ事項: GO 判定書 / user 承認 G3 ログ / 24h baseline / `RELEASE_TAG`
- ブロック条件: NO-GO 判定 / user 未承認 / REJECTED のいずれかで Phase 11 に進まない

## リスクと対策

| リスク | 対策 |
| --- | --- |
| user 承認なしで Phase 11 に進行 | 本 Phase 完了条件に「承認ログ保存」を必須化、artifacts.json で gate を明示 |
| GO 判定後に未検出の異常が顕在化 | Phase 11 24h 観測中の Workers req / D1 metrics を逐次確認、閾値超過時は incident runbook を即起動 |
| NO-GO rollback の VERSION_ID 取り違え | Phase 7 evidence に「直前 stable version」を必ず保存、rollback 実行前に dashboard で再確認 |
| release tag 削除漏れ | NO-GO 時のチェックリストに `git push origin --delete` を含め、`git ls-remote --tags origin` で削除確認 |
| 承認ログの PII 流出 | approver は user 識別子（メール先頭部分やハンドル）に留め、機微情報は記録しない |
| GO / NO-GO 判定が evidence と矛盾 | 判定書に各 AC の evidence path を必ず記載、レビュー時に追跡可能にする |
| incident 共有の取り違え（AC-9 と混同） | NO-GO 時の `incident-share-evidence.md` と Phase 11 の `share-evidence.md`（AC-9 ）はファイル名で分離 |
