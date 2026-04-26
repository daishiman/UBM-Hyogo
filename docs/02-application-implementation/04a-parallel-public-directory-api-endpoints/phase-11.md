# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | pending |

## 目的

ローカル / staging で `/public/*` 4 endpoint を curl と wrangler tail で動作確認し、curl 出力 / D1 query 結果を evidence として保存する。本タスクは spec_created なので実コマンドはランブック化のみ、実行は実装タスクに引き継ぐ。leak ゼロ（`responseEmail` / `rulesConsent` / `adminNotes` keys 不在）と未認証 200 を smoke で再確認することが核。

## Manual smoke 手順

### 前提

- ローカルで `pnpm --filter api dev` が起動（`http://localhost:8787`）
- D1 に `members` / `member_status` / `member_responses` / `response_fields` / `member_tags` / `schema_questions` / `sync_jobs` の seed が入っている
- 適格 6 / declined 2 / hidden 1 / deleted 1 の 10 member fixture が D1 に投入済み
- 認証は不要（公開 endpoint）

### Smoke step

#### 1. GET /public/stats（200）

```bash
curl -s http://localhost:8787/public/stats | jq
```

期待: `{ totalPublicMembers: 6, byZone: {...}, meetingsThisYear: number, recentMeetings: [...], lastSync: 'ok' | 'running' | 'failed' | 'never' }`

#### 2. GET /public/members（200、適格 6 件）

```bash
curl -s "http://localhost:8787/public/members?limit=10" | jq '.items | length'
```

期待: `6`、`items[].keys` に `responseEmail` / `publicConsent` / `rulesConsent` / `adminNotes` 不在

#### 3. GET /public/members tag AND 検索（AC-5）

```bash
curl -s "http://localhost:8787/public/members?tag=ai&tag=dx" | jq '.items[] | .memberId'
```

期待: tag `ai` と `dx` 両方を持つ member のみ列挙

#### 4. GET /public/members 不正 query fallback（AC-6）

```bash
curl -s "http://localhost:8787/public/members?zone=invalid&sort=__proto__&limit=10000" | jq '.meta'
```

期待: `meta.limit = 100`（clamp）、200 で返り、422 にならない

#### 5. GET /public/members/:適格（200）

```bash
curl -s http://localhost:8787/public/members/m_eligible_001 | jq 'keys'
```

期待: keys に `responseEmail` / `rulesConsent` / `adminNotes` 不在、`sections[].fields[]` の visibility 全て public

#### 6. GET /public/members/:不適格（404 三種）

```bash
for id in m_declined_001 m_hidden_001 m_deleted_001; do
  echo "$id"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8787/public/members/$id"
done
```

期待: 全て `404`、本文は `{ "code": "NOT_FOUND" }`、member 情報を一切含まない

#### 7. GET /public/members/:存在しない（404）

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/public/members/m_nonexistent
```

期待: `404`（不適格と区別不能）

#### 8. GET /public/form-preview（200、31 / 6）

```bash
curl -s http://localhost:8787/public/form-preview | jq '{sections: (.sections | length), totalFields: ([.sections[].fields[]] | length), responderUrl}'
```

期待: `sections=6`、`totalFields=31`、`responderUrl` が `01-api-schema.md` の固定値と一致

#### 9. 未認証で全 endpoint 200（AC-9）

```bash
for path in "/public/stats" "/public/members" "/public/members/m_eligible_001" "/public/form-preview"; do
  echo "$path"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8787$path"
done
```

期待: 全 endpoint で `200`（401 / 403 を返さない）

#### 10. wrangler tail で write が走らないことを確認

```bash
wrangler tail --format pretty &
# 別 terminal で smoke step 1〜9 を実行
# 期待: D1 へのログに INSERT / UPDATE / DELETE が 0 件
```

#### 11. D1 へ直接照会（leak リグレッション最終確認）

```bash
wrangler d1 execute ubm-hyogo --command \
  "SELECT m.member_id, s.public_consent, s.publish_state, s.is_deleted FROM members m JOIN member_status s ON s.member_id = m.member_id"
```

期待: D1 上の不適格 member が `/public/members` items から確実に除外されている

#### 12. 圧縮確認（AC-12）

```bash
curl -s -H "Accept-Encoding: gzip, br" -I http://localhost:8787/public/members | grep -i content-encoding
```

期待: `Content-Encoding: gzip` または `br` のいずれか（Cloudflare Workers 標準）

## Manual evidence

| evidence | 保存先 | 取得方法 |
| --- | --- | --- |
| GET /public/stats レスポンス | outputs/phase-11/get-stats.json | curl 出力 |
| GET /public/members レスポンス | outputs/phase-11/get-members.json | curl 出力 |
| GET /public/members tag AND | outputs/phase-11/get-members-tag-and.json | curl 出力 |
| GET /public/members 不正 query | outputs/phase-11/get-members-invalid-query.json | curl 出力 |
| GET /public/members/:適格 | outputs/phase-11/get-member-profile.json | curl 出力 |
| GET /public/members/:不適格 404 三種 | outputs/phase-11/get-member-404.txt | curl -o |
| GET /public/form-preview | outputs/phase-11/get-form-preview.json | curl 出力 |
| 未認証 200 結果 | outputs/phase-11/unauth-200.txt | curl -o |
| wrangler tail（write 0） | outputs/phase-11/wrangler-tail.txt | tail 中の query 行 |
| D1 直接照会結果 | outputs/phase-11/d1-direct-check.txt | wrangler d1 execute |
| Content-Encoding header | outputs/phase-11/compression-header.txt | curl -I |

## 確認観点

- [ ] `/public/members` items に不適格 member が 0 件（leak ゼロ / 不変条件 #2 / #11）
- [ ] `/public/members/:不適格` は 404、本文に member 情報 0 字（不変条件 #11）
- [ ] `/public/members/:適格` keys に `responseEmail` / `rulesConsent` / `adminNotes` 不在（不変条件 #3 / #11）
- [ ] sections[].fields[] の visibility 全て public（不変条件 #1）
- [ ] form-preview の sections=6 / fields=31 / responderUrl が固定値一致（不変条件 #14）
- [ ] 未認証で 4 endpoint 全て 200（AC-9 / 不変条件 #5 公開境界）
- [ ] D1 への write 0 件（不変条件 #10）
- [ ] tag AND filter が AC-5 通り

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | 期待挙動 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | 検索仕様 |
| 必須 | outputs/phase-04/test-matrix.md | smoke と test の対応 |
| 参考 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 操作 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | manual evidence を documentation-changelog に記録 |
| 09a | staging で再実行 |
| 08b | Playwright が同等のフローを E2E 化 |

## 多角的チェック観点（不変条件マッピング）

- #1（schema 固定禁止）— sections[].fields[] visibility check と form-preview 31/6 を smoke で確認
- #2（consent キー）— D1 直接照会で declined を確認、items に出ないことを確認
- #3（`responseEmail` system field）— keys 不在を curl + jq で確認
- #5（apps/web → D1 直禁止）— 構造的に保証（本タスクは apps/api 内 smoke）
- #10（無料枠）— wrangler tail で write 0 確認
- #11（admin-managed 分離）— `adminNotes` keys 不在、404 で member 情報 0 字
- #14（schema 集約）— form-preview の field 数を smoke で確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | smoke step 12 件 runbook 化 | 11 | pending | outputs/phase-11/main.md |
| 2 | evidence 保存先固定 | 11 | pending | outputs/phase-11/manual-evidence.md |
| 3 | 確認観点チェック | 11 | pending | 8 項目 |
| 4 | 不適格 fixture 投入手順 | 11 | pending | 10 member 構成 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 主成果物 |
| ドキュメント | outputs/phase-11/manual-evidence.md | evidence 一覧と取得方法 |
| メタ | artifacts.json | Phase 11 を `completed` に更新 |

## 完了条件

- [ ] 12 step の smoke 手順が curl レベルで記述
- [ ] evidence 11 種の保存先が定義
- [ ] 確認観点 8 項目が記述
- [ ] 不適格 fixture（declined 2 / hidden 1 / deleted 1）の投入手順が記述

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 全完了条件チェック
- [ ] artifacts.json の Phase 11 を `completed` に更新

## 次 Phase

- 次: 12（ドキュメント更新）
- 引き継ぎ事項: evidence を Phase 12 の changelog に組み込む
- ブロック条件: 確認観点 8 項目のいずれかが NG（特に leak 系）なら次 Phase に進まない
