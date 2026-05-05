# 05a follow-up: runbook の URL 200 確認手順を GET に統一

## メタ情報

```yaml
issue_number: 390
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-05a-runbook-curl-method-fix-001 |
| タスク名 | Phase 11 runbook の `curl -I` 利用箇所を GET に置き換える |
| 分類 | documentation |
| 対象機能 | manual-runbook / endpoint check 手順 |
| 優先度 | Low |
| ステータス | 未実施 |
| 発見元 | `ut-05a-followup-google-oauth-completion` Phase 11 Stage A 検証中 |
| 発見日 | 2026-05-01 |

## 背景

`curl -I` (HEAD) で `/api/auth/providers` `/api/auth/csrf` `/api/auth/session` を叩くと 400 が返る。Auth.js が `UnknownAction: Only GET and POST requests are supported` を error log に出力する。GET で叩けば 200。本番に HEAD method を受ける用途は無いが、runbook の検証手順が誤検知を招くため修正したい。

## 目的

Phase 11 manual-runbook を含む URL 200 確認手順を `curl -s -o /dev/null -w "%{http_code}"` (GET) に統一し、Auth.js endpoint も含めた全 endpoint で正しい status code を取得できるようにする。

## スコープ

含む:

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/manual-runbook.md` の `curl -I` を `curl -s -o /dev/null -w "%{http_code}"` に置換
- 注記追加: Auth.js endpoint は HEAD 不可

含まない:

- Auth.js のエラーログ抑制
- 他 workflow の runbook 修正

## 受け入れ条件

- runbook 内の URL 200 確認コマンドが GET ベースに統一されている
- Auth.js endpoint で 200 が取得できることを再実行で確認

## 関連

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-OBS-001`

## 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/manual-runbook.md` の `curl -I` を含む箇所
- 症状: `curl -I` (HEAD) で Auth.js endpoint (`/api/auth/providers` `/api/auth/csrf` `/api/auth/session`) を叩くと Auth.js が `UnknownAction: Only GET and POST requests are supported` を返し 400 となる。GET (`curl -s -o /dev/null -w "%{http_code}"`) では 200。runbook 検証手順で誤検知が発生。具体的な誤指定の方向（POST/GET の取り違え等）は調査 pending（未確定）
- 参照:
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-OBS-001`
  - GitHub Issue #390

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 一括置換で `-I` 文字列を含む別意味の箇所まで書き換える | `grep -n 'curl -I' <runbook>` で対象行を列挙し、個別 review で置換 |
| GET 化により body 込みでログが肥大化 | `-o /dev/null` を必ず付け body 出力を捨てる |
| Auth.js 以外の endpoint で HEAD が有効な箇所まで GET 化して挙動意図が変わる | 注記で「Auth.js endpoint は HEAD 不可」と明示し、他 endpoint への影響を review で確認 |
| 他の workflow runbook にも類似誤指定が残る | 本タスクスコープ外として記録し、別未タスクで横断対応する |

## 検証方法

- 実行コマンド:
  - `grep -n 'curl -I' docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/manual-runbook.md`（残存ゼロを確認）
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/api/auth/providers`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/api/auth/csrf`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/api/auth/session`
- 期待結果:
  - `grep` 結果が 0 件
  - 上記 3 endpoint が 200 を返す
  - runbook に「Auth.js endpoint は HEAD 不可」の注記が追記されている
- 失敗時の切り分け:
  1. 400 が再発 → method を再確認し、endpoint ごとに GET / POST のいずれが正しいか Auth.js docs で確認
  2. `grep` でヒット残存 → 残箇所を個別置換
  3. 他 workflow に同種記述 → 別未タスク化して切り出す
