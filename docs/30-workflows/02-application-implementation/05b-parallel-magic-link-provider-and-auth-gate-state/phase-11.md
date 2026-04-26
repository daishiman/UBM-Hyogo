# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

人が手で確認すべき UI / 認可 / Forms 同期との接続点を smoke として実行する手順を残す。screenshot / curl 結果 / wrangler 出力を outputs/phase-11/ に保存する placeholder を提供する。

## 実行タスク

1. wrangler dev で apps/api 起動
2. 5 状態 × curl smoke
3. callback URL を手で踏んで session 確立
4. レートリミット手動検証
5. evidence を outputs/phase-11/ に保存

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | sanity check |
| 必須 | outputs/phase-10/main.md | blocker B-02 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | 期待 UX |

## 実行手順

### ステップ 1: 起動

```bash
pnpm wrangler dev --env staging
```

期待: `http://localhost:8787` で apps/api が listen

### ステップ 2: 5 状態 curl smoke

| # | 入力 | 期待 | evidence path |
| --- | --- | --- | --- |
| M-01 | unknown@example.com | `{state:"unregistered"}` | outputs/phase-11/curl-unregistered.txt |
| M-02 | declined@example.com (rules!=consented) | `{state:"rules_declined"}` | outputs/phase-11/curl-rules-declined.txt |
| M-03 | deleted@example.com (isDeleted=true) | `{state:"deleted"}` | outputs/phase-11/curl-deleted.txt |
| M-04 | valid@example.com | `{state:"sent"}` + token insert | outputs/phase-11/curl-sent.txt |
| M-05 | M-04 の token で callback | session cookie 取得 | outputs/phase-11/callback-success.txt |

### ステップ 3: callback 手動

```bash
# M-04 のメール本文に含まれる URL を copy
# ブラウザで踏んで /profile に redirect されることを確認
# screenshot を outputs/phase-11/screenshot-profile.png に保存
```

### ステップ 4: レートリミット手動検証

```bash
for i in $(seq 1 6); do
  curl -X POST http://localhost:8787/auth/magic-link \
    -H 'content-type: application/json' \
    -d '{"email":"valid@example.com"}'
done
# 期待: 6 回目が 429
# evidence: outputs/phase-11/rate-limit.txt
```

### ステップ 5: `/no-access` 不在確認

```bash
find apps/web/app/no-access -type d 2>&1 || echo "OK: not found"
# evidence: outputs/phase-11/no-access-check.txt
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を implementation-guide に反映 |
| 09a | staging で再実行 |

## 多角的チェック観点

- 不変条件 #2: M-02 の rules_declined が意図通り出る
- 不変条件 #4: M-03 で deleted が出るが、本人本文編集を促す UI に飛ばない
- 不変条件 #5: D1 access が apps/api 経由のみ（curl は apps/web ではなく apps/api のみ叩く）
- 不変条件 #9: ステップ 5 で `/no-access` が無い
- 不変条件 #10: ステップ 4 のレートリミットで mail 送信が制限される

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler dev 起動 | 11 | pending | port 8787 |
| 2 | 5 状態 curl | 11 | pending | M-01〜M-05 |
| 3 | callback 手動 | 11 | pending | screenshot |
| 4 | レートリミット | 11 | pending | 429 確認 |
| 5 | /no-access 不在 | 11 | pending | find |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリ |
| evidence | outputs/phase-11/curl-*.txt | curl レスポンス |
| evidence | outputs/phase-11/screenshot-*.png | UI 確認 |
| evidence | outputs/phase-11/rate-limit.txt | レートリミット出力 |
| evidence | outputs/phase-11/no-access-check.txt | fs check |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] 5 サブタスクの evidence が保存
- [ ] M-01〜M-05 全て期待通り
- [ ] レートリミット 429 が確認
- [ ] `/no-access` 不在が確認

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- evidence ファイルが outputs/phase-11/ に保存
- 全完了条件にチェック
- 不変条件 #2, #4, #5, #9, #10 への対応 evidence を含む
- 次 Phase へ implementation-guide の入力を引継ぎ

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke 結果を implementation-guide.md に反映
- ブロック条件: smoke が NG だった場合は Phase 5 へ戻る

## manual evidence

| 項目 | path | format |
| --- | --- | --- |
| curl unregistered | outputs/phase-11/curl-unregistered.txt | plaintext |
| curl rules_declined | outputs/phase-11/curl-rules-declined.txt | plaintext |
| curl deleted | outputs/phase-11/curl-deleted.txt | plaintext |
| curl sent | outputs/phase-11/curl-sent.txt | plaintext |
| callback success | outputs/phase-11/callback-success.txt | plaintext |
| profile screenshot | outputs/phase-11/screenshot-profile.png | png |
| rate limit | outputs/phase-11/rate-limit.txt | plaintext |
| no-access check | outputs/phase-11/no-access-check.txt | plaintext |
| wrangler dev log | outputs/phase-11/wrangler-dev.log | plaintext |
