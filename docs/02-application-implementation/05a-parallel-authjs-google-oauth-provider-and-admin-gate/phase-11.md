# Phase 11 — 手動 smoke: OAuth flow / admin gate / bypass 試行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 11 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-10（最終レビュー） |
| 下流 | phase-12（ドキュメント更新） |

## 目的

人が手で確認すべき OAuth flow / admin gate / 二段防御の bypass 試行 を smoke として実行する手順を残す。screenshot / curl 結果 / wrangler 出力を outputs/phase-11/ に保存する placeholder を提供する。

## 実行タスク

1. wrangler dev で apps/api 起動
2. pnpm dev で apps/web 起動
3. OAuth flow を手動で実行（admin / 一般 / 未登録 / deleted）
4. admin gate の二段防御 を手動検証
5. bypass 試行（`?bypass=true`、JWT 改ざん）
6. evidence を outputs/phase-11/ に保存

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | sanity check 詳細 |
| 必須 | outputs/phase-10/main.md | blocker B-01〜B-03 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | 期待 UX |
| 参考 | doc/00-getting-started-manual/specs/11-admin-management.md | admin 権限境界 |

## 実行手順

### ステップ 1: 起動

```bash
# Terminal 1
pnpm wrangler dev --env staging
# 期待: http://localhost:8787 で apps/api が listen

# Terminal 2
pnpm dev --filter=@ubm/web
# 期待: http://localhost:3000 で apps/web が listen
```

### ステップ 2: OAuth flow 手動 smoke

| # | 入力 | 期待 | evidence path |
| --- | --- | --- | --- |
| M-01 | unregistered email で `/login` → Google OAuth → callback | `/login?gate=unregistered` redirect | outputs/phase-11/screenshot-unregistered.png |
| M-02 | rules_declined seed user で OAuth | `/login?gate=rules_declined` redirect | outputs/phase-11/screenshot-rules-declined.png |
| M-03 | deleted seed user で OAuth | `/login?gate=deleted` redirect | outputs/phase-11/screenshot-deleted.png |
| M-04 | 一般 member（admin_users 無し）で OAuth | session 確立、`/profile` 表示、`session.user.isAdmin === false` | outputs/phase-11/screenshot-member-profile.png + outputs/phase-11/session-member.json |
| M-05 | admin member（admin_users あり）で OAuth | session 確立、`/profile` 表示、`session.user.isAdmin === true` | outputs/phase-11/screenshot-admin-profile.png + outputs/phase-11/session-admin.json |

### ステップ 3: admin gate 二段防御 手動検証

| # | シナリオ | 期待 | evidence path |
| --- | --- | --- | --- |
| M-06 | 未ログインで `/admin/dashboard` を開く | `/login?gate=admin_required` redirect | outputs/phase-11/screenshot-admin-no-auth.png |
| M-07 | M-04 の member cookie で `/admin/dashboard` を開く | `/login?gate=admin_required` redirect | outputs/phase-11/screenshot-admin-non-admin.png |
| M-08 | M-05 の admin cookie で `/admin/dashboard` を開く | dashboard 表示 | outputs/phase-11/screenshot-admin-ok.png |
| M-09 | M-04 の JWT で `curl http://localhost:8787/admin/users` | 403 `{error:"forbidden"}` | outputs/phase-11/curl-admin-non-admin.txt |
| M-10 | M-05 の JWT で `curl http://localhost:8787/admin/users` | 200 + user list | outputs/phase-11/curl-admin-ok.txt |
| M-11 | Authorization header なしで `curl http://localhost:8787/admin/users` | 401 `{error:"unauthorized"}` | outputs/phase-11/curl-admin-no-auth.txt |

### ステップ 4: bypass 試行

```bash
# F-15: ?bypass=true クエリ
curl -i 'http://localhost:3000/admin/dashboard?bypass=true'
# 期待: 302 to /login?gate=admin_required (bypass 無視)
# evidence: outputs/phase-11/bypass-query.txt

# F-16: 偽造 cookie
curl -i 'http://localhost:3000/admin/dashboard' \
  -H 'Cookie: authjs.session-token=fake.jwt.value'
# 期待: 302 to /login (verify fail)
# evidence: outputs/phase-11/bypass-cookie.txt

# F-09: JWT payload 書き換え（base64 で `isAdmin: false` → `true` に変更）
# 期待: signature mismatch で verify fail → 401
# evidence: outputs/phase-11/jwt-tampered.txt
```

### ステップ 5: `/no-access` 不在確認

```bash
find apps/web/app/no-access -type d 2>&1 || echo "OK: not found"
find apps/web/src/app/no-access -type d 2>&1 || echo "OK: not found"
# evidence: outputs/phase-11/no-access-check.txt
```

### ステップ 6: B-01 race condition 手動確認

```bash
# 1. M-05 の admin で OAuth ログイン → admin cookie 取得
# 2. D1 で admin_users から該当 memberId を DELETE
# 3. 同じ cookie で curl /admin/users
# 期待: JWT 内 isAdmin=true なので 200 が返る（既知の制約 B-01）
# 4. ログアウト → 再ログイン
# 期待: jwt callback で session-resolve 再実行 → isAdmin=false で session 確立 → /admin/* で 302
# evidence: outputs/phase-11/race-condition-admin-revoke.txt
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を implementation-guide に反映 |
| 05b Phase 11 | session 共有が両 provider で動くことを再確認 |
| 09a | staging で再実行 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #2 (consent キー統一) | M-02 で rules_declined が `rulesConsent` を見て出る | #2 |
| #4 (deleted の挙動) | M-03 で session 不発、本人本文編集 UI に飛ばない | #4 |
| #5 (apps/web → D1 禁止) | session-resolve が必ず apps/api を経由（curl で直接確認） | #5 |
| #7 (memberId と responseId 分離) | M-04, M-05 の `session-*.json` で memberId のみ含むことを確認 | #7 |
| #9 (`/no-access` 不在) | ステップ 5 で 0 件 | #9 |
| #11 (admin gate) | M-06〜M-11 で middleware + requireAdmin 二段防御を網羅 | #11 |
| 観測性 | 07c の audit log に gate 拒否が出力される hook を確認 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler dev / pnpm dev 起動 | 11 | pending | 2 サーバー |
| 2 | OAuth flow 手動 smoke | 11 | pending | M-01〜M-05 |
| 3 | admin gate 二段防御 | 11 | pending | M-06〜M-11 |
| 4 | bypass 試行 | 11 | pending | F-09, F-15, F-16 |
| 5 | /no-access 不在 | 11 | pending | find |
| 6 | B-01 race condition 確認 | 11 | pending | admin 剥奪 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリ |
| evidence | outputs/phase-11/screenshot-*.png | UI 確認 |
| evidence | outputs/phase-11/curl-admin-*.txt | API gate 結果 |
| evidence | outputs/phase-11/bypass-*.txt | bypass 試行結果 |
| evidence | outputs/phase-11/jwt-tampered.txt | JWT 改ざん試行 |
| evidence | outputs/phase-11/no-access-check.txt | fs check |
| evidence | outputs/phase-11/race-condition-admin-revoke.txt | B-01 確認 |
| evidence | outputs/phase-11/session-member.json | member session shape |
| evidence | outputs/phase-11/session-admin.json | admin session shape |
| evidence | outputs/phase-11/wrangler-dev.log | wrangler 出力 |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] 6 サブタスクの evidence が保存
- [ ] M-01〜M-11 全て期待通り
- [ ] bypass 試行が全て阻止される
- [ ] `/no-access` 不在が確認
- [ ] B-01 race condition の挙動が想定通り（既知制約）

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- evidence ファイルが outputs/phase-11/ に保存
- 全完了条件にチェック
- 不変条件 #2, #4, #5, #7, #9, #11 への対応 evidence を含む
- 次 Phase へ implementation-guide の入力を引継ぎ

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke 結果を implementation-guide.md に反映、B-01 を既知制約として記録
- ブロック条件: smoke が NG（M-XX いずれかの期待外）の場合は Phase 5 へ戻る

## manual evidence

| 項目 | path | format |
| --- | --- | --- |
| screenshot unregistered | outputs/phase-11/screenshot-unregistered.png | png |
| screenshot rules_declined | outputs/phase-11/screenshot-rules-declined.png | png |
| screenshot deleted | outputs/phase-11/screenshot-deleted.png | png |
| screenshot member profile | outputs/phase-11/screenshot-member-profile.png | png |
| screenshot admin profile | outputs/phase-11/screenshot-admin-profile.png | png |
| screenshot admin no-auth | outputs/phase-11/screenshot-admin-no-auth.png | png |
| screenshot admin non-admin | outputs/phase-11/screenshot-admin-non-admin.png | png |
| screenshot admin OK | outputs/phase-11/screenshot-admin-ok.png | png |
| curl admin non-admin | outputs/phase-11/curl-admin-non-admin.txt | plaintext |
| curl admin OK | outputs/phase-11/curl-admin-ok.txt | plaintext |
| curl admin no-auth | outputs/phase-11/curl-admin-no-auth.txt | plaintext |
| bypass query | outputs/phase-11/bypass-query.txt | plaintext |
| bypass cookie | outputs/phase-11/bypass-cookie.txt | plaintext |
| jwt tampered | outputs/phase-11/jwt-tampered.txt | plaintext |
| no-access check | outputs/phase-11/no-access-check.txt | plaintext |
| race condition | outputs/phase-11/race-condition-admin-revoke.txt | plaintext |
| session member | outputs/phase-11/session-member.json | json |
| session admin | outputs/phase-11/session-admin.json | json |
| wrangler dev log | outputs/phase-11/wrangler-dev.log | plaintext |
