# Phase 9: production smoke + 認可境界検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09c-production-deploy-execution-001 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | production smoke + 認可境界検証 |
| Wave | 9 (execution 半身) |
| Mode | serial（最終 / production mutation） |
| 作成日 | 2026-05-02 |
| 前 Phase | 8 (release tag 付与 + push) |
| 次 Phase | 10 (GO/NO-GO 判定 / user 承認 2 回目) |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | **VISUAL（screenshots 30 枚 = 10 ページ × 3 ロール）** |
| user_approval | 不要（Phase 10 で 2 回目承認） |

## 目的

`RELEASE_TAG` 配下の production 環境に対し、10 ページ × 3 ロール（admin / member / 未ログイン）の手動 smoke と API 3 endpoint の curl smoke を実行し、**HTTP status / 認可境界 / 不変条件 #4 #5 #11 #15 / VISUAL evidence（screenshots）** をすべて取得する。staging 09a の smoke と同一手順を production URL（`${PRODUCTION_API}` / `${PRODUCTION_WEB}`）で再実行することで、staging green と production green の同値性を確認し、Phase 10 の GO/NO-GO 判定の最大根拠とする。

## 実行タスク

1. 10 ページ × 3 ロールの smoke matrix 実行（HTTP status / 表示 / 認可境界）
2. API 3 endpoint smoke（`GET /api/health` / `POST /admin/sync/schema` / `POST /admin/sync/responses`）
3. 不変条件 #4 / #5 / #11 / #15 の production 文脈再確認
4. screenshots（VISUAL evidence）を `outputs/phase-09/screenshots/` に 30 枚保存
5. authz matrix（30 セル）を `outputs/phase-09/authz-matrix.md` に保存
6. smoke evidence を `outputs/phase-09/smoke-evidence.md` に集約

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-09.md | a11y / smoke 観点の正本 |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/index.md | staging smoke 手順（同値手順） |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/phase-08.md | `RELEASE_TAG` 引き継ぎ |
| 必須 | docs/30-workflows/09c-production-deploy-execution-001/index.md | AC-7 / AC-11 / AC-13 の根拠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | production URL 仕様 |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | 認可境界（admin / member / 未ログイン）|
| 参考 | scripts/cf.sh | Cloudflare CLI wrapper（直 wrangler 禁止） |

## 実行手順

### ステップ 1: 環境変数と smoke matrix の準備

```bash
PRODUCTION_API="<本番 API URL>"   # ${PRODUCTION_API}
PRODUCTION_WEB="<本番 Web URL>"   # ${PRODUCTION_WEB}
RELEASE_TAG="<Phase 8 で確定した tag>"

# Cloudflare account identity 再確認
bash scripts/cf.sh whoami
```

期待: account identity が production 操作対象と一致。

### ステップ 2: 10 ページ × 3 ロール smoke

対象ページ:

1. `/`（公開トップ）
2. `/members`（会員ディレクトリ・公開）
3. `/members/:id`（会員詳細・公開）
4. `/login`（ログイン入口）
5. `/profile`（本人マイページ / member 必須）
6. `/admin`（管理ダッシュボード / admin 必須）
7. `/admin/members`（会員一覧 / admin 必須）
8. `/admin/tags`（タグ管理 / admin 必須）
9. `/admin/schema`（schema diff / admin 必須）
10. `/admin/meetings`（会合管理 / admin 必須）

ロール:

- A. **admin**: admin 権限を持つ Google アカウントでログイン
- B. **member**: 一般会員アカウントでログイン
- C. **未ログイン**: シークレットウィンドウ等でセッションなし

各セルで以下を取得:

```bash
# サンプル: ロール C / `/admin` の HTTP status 確認
curl -s -o /dev/null -w "%{http_code}\n" "${PRODUCTION_WEB}/admin"
# 期待: 302 (login へ redirect) / 401 / 403 のいずれか
```

screenshots 取得（手動 / 30 枚）:

- 命名規則: `outputs/phase-09/screenshots/<role>-<page-slug>.png`
- 例: `admin-admin-members.png`, `member-profile.png`, `guest-members.png`
- ページスクロール込みの全体像を撮影、機微情報（実名 / メール）が映る場合は黒塗りマスク

### ステップ 3: API smoke（curl）

```bash
# 3-1. health（公開）
curl -s -o /tmp/api-health.json -w "%{http_code}\n" "${PRODUCTION_API}/api/health"
# 期待: 200, body に { "status": "ok", ... }

# 3-2. admin sync schema（admin token 必須 / 未認証は 401）
curl -s -o /tmp/api-401.json -w "%{http_code}\n" \
  -X POST "${PRODUCTION_API}/admin/sync/schema"
# 期待: 401

# 3-3. admin sync schema（admin token あり）
curl -s -o /tmp/api-sync-schema.json -w "%{http_code}\n" \
  -X POST "${PRODUCTION_API}/admin/sync/schema" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
# 期待: 200 / 202 / 204 のいずれか（runbook 仕様に従う）

# 3-4. admin sync responses（admin token あり）
curl -s -o /tmp/api-sync-responses.json -w "%{http_code}\n" \
  -X POST "${PRODUCTION_API}/admin/sync/responses" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
# 期待: 200 / 202 / 204
```

注意: `${ADMIN_TOKEN}` は環境変数経由で渡し、コマンド履歴・ログに値を残さない。`unset ADMIN_TOKEN` で破棄する。

### ステップ 4: 不変条件 production 再確認

| 不変条件 | 確認方法（production） | 期待 |
| --- | --- | --- |
| #4 本人本文を D1 override しない | `/profile` を member ロールで開き、本文編集 form が UI に存在しないことを screenshot で確認 | form 不在 |
| #5 web → D1 直接禁止 | `RELEASE_TAG` の web build artifact を `git show ${RELEASE_TAG}:apps/web` 経由 ではなく、Phase 7 の build log / `apps/web/.open-next/` artifact grep で確認（`rg "D1Database\|env\.DB" apps/web/.open-next/`） | 0 hit |
| #11 admin は本文編集不可 | `/admin/members/:id` を admin ロールで開き、本人本文の input/textarea が無効化（readonly / disabled）であることを screenshot で確認 | 編集不能 |
| #15 attendance 重複防止 / 削除済み除外 | `/admin/meetings/:id` で同一 member を 2 回 attendance 追加した場合に unique 制約で reject されること、削除済み member が出席候補に表示されないことを screenshot + admin 操作で確認（test レコードを使用、本番データ汚染しない） | reject + 非表示 |

### ステップ 5: authz matrix 作成

`outputs/phase-09/authz-matrix.md` に 30 セル（10 ページ × 3 ロール）の表を作成:

| ページ | admin | member | guest |
| --- | --- | --- | --- |
| `/` | 200 | 200 | 200 |
| `/members` | 200 | 200 | 200 |
| `/members/:id` | 200 | 200 | 200 |
| `/login` | 200 (or redirect to /profile) | 200 (or redirect) | 200 |
| `/profile` | 200 | 200 | 302→/login |
| `/admin` | 200 | 403 (or 302→/) | 302→/login |
| `/admin/members` | 200 | 403 | 302→/login |
| `/admin/tags` | 200 | 403 | 302→/login |
| `/admin/schema` | 200 | 403 | 302→/login |
| `/admin/meetings` | 200 | 403 | 302→/login |

各セルに HTTP status + screenshot path + 認可挙動の備考を記録。

### ステップ 6: evidence 集約

`outputs/phase-09/smoke-evidence.md` に以下を記録:

- `RELEASE_TAG` / `RELEASE_COMMIT`
- 実行日時（JST）
- smoke matrix 結果（PASS / FAIL）
- API smoke 結果（4 ケースの HTTP status と body サマリ）
- 不変条件 #4 / #5 / #11 / #15 の確認結果
- screenshots 一覧（30 件 + 不変条件補助 screenshots）
- 異常検出時の暫定対応（rollback 必要性の事前評価）

### ステップ 7: Cloudflare CLI wrapper 検証

```bash
# wrangler 直実行 0 件 grep evidence（AC-13）
git grep -nE "^\s*wrangler " docs/30-workflows/09c-production-deploy-execution-001/ \
  || echo "OK: no direct wrangler invocation in this task"
```

期待: `OK` 出力。`bash scripts/cf.sh` 経由のみ。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | smoke matrix / authz matrix / 不変条件結果を GO/NO-GO 判定の根拠 |
| Phase 11 | 24h 検証の baseline として smoke 時刻と Workers req を保存 |
| Phase 13 | PR body にスクリーンショット参照を含める |
| 上流 09a | staging smoke と同値性を比較 |
| 上流 09b | release runbook の Step 8 完了マーキング |

## 多角的チェック観点（不変条件）

- 不変条件 #4: `/profile` UI に本文編集 form がないことを screenshot で確認
- 不変条件 #5: web build artifact に D1 import 0 件 grep
- 不変条件 #11: admin UI で本人本文 input/textarea が無効化されている screenshot
- 不変条件 #15: attendance 重複追加が reject される / 削除済み member 非表示
- 不変条件 #6: production smoke 中に GAS apps script 由来のレスポンス（`onFormSubmit` 等）が観測されないこと
- 認可境界 30 セル全 PASS が AC-7 達成条件
- VISUAL evidence: screenshots は最低 30 枚、不変条件補助で +α
- Cloudflare CLI: `bash scripts/cf.sh whoami` のみで直 wrangler 不使用（AC-13）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 環境変数準備 + cf.sh whoami | 9 | pending | account identity 確認 |
| 2 | 10 ページ × 3 ロール smoke | 9 | pending | 30 セル |
| 3 | API smoke 4 ケース | 9 | pending | health / 401 / sync x2 |
| 4 | 不変条件 #4/#5/#11/#15 確認 | 9 | pending | 表 + screenshot |
| 5 | screenshots 取得 | 9 | pending | 30+α 枚 |
| 6 | authz matrix 作成 | 9 | pending | 30 セル表 |
| 7 | smoke evidence 集約 | 9 | pending | smoke-evidence.md |
| 8 | wrangler 直実行 0 件 grep | 9 | pending | AC-13 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/smoke-evidence.md | smoke 全体結果 / API 結果 / 不変条件結果 |
| ドキュメント | outputs/phase-09/authz-matrix.md | 30 セル authz 表 |
| 画像 | outputs/phase-09/screenshots/*.png | VISUAL evidence 30+ 枚 |
| メタ | artifacts.json | Phase 9 を completed に更新 |

## 完了条件

- [ ] 10 ページ × 3 ロール smoke が全 30 セル実施済み
- [ ] HTTP status が authz matrix 期待値と一致
- [ ] API smoke 4 ケース全 PASS
- [ ] 不変条件 #4 / #5 / #11 / #15 が production で再確認 PASS
- [ ] screenshots 30 枚以上が `outputs/phase-09/screenshots/` に保存
- [ ] `wrangler` 直実行 0 件（grep evidence）

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 30 セル authz matrix に空白 / FAIL なし、または FAIL は Phase 10 NO-GO 候補として明記
- screenshots 命名規則違反 0 件
- 機微情報マスク済み（実名 / メール / D1 内部 ID）
- artifacts.json の phase 9 を completed に更新

## 次 Phase

- 次: 10 (GO/NO-GO 判定 / user 承認 2 回目)
- 引き継ぎ事項: smoke-evidence.md / authz-matrix.md / screenshots / FAIL があればその一覧
- ブロック条件: smoke 実行未完 / screenshots 不足 / 不変条件再確認未済のいずれかで Phase 10 に進まない

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 本番データ汚染（不変条件 #15 確認時） | test member を専用 seed として用意、確認後即削除、削除 SQL を evidence に残す |
| `${ADMIN_TOKEN}` のログ流出 | 環境変数経由のみ、`set +x` / `history -d`、curl 後 `unset` |
| screenshots に PII（実名 / メール）混入 | 撮影前にダミーアカウントへ切替、不可避な場合は黒塗りマスクを画像編集で適用 |
| staging と production の挙動差異検出 | smoke matrix 各 FAIL を Phase 10 で NO-GO 候補として扱い、rollback 判定材料にする |
| 認可境界の取り違え | 各ロールごとに別ブラウザプロファイル / シークレットウィンドウを使用、セッション混在を防止 |
| API smoke の rate limit | 1 ケースずつ実行、429 観測時は 60 秒待機して再試行、再試行回数を evidence に記録 |
