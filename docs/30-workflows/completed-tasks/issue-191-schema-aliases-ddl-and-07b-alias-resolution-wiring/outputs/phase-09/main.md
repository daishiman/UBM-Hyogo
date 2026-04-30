# Phase 9 出力: 品質保証（issue-191）

Phase 8 までの設計・実装・正規化が、Cloudflare 無料枠 / secret hygiene / a11y / 不変条件 (#1 / #5 / #14) のいずれにも違反しないことを定量・定性両面で点検する。

## Cloudflare D1 無料枠 影響見積

### 前提値

| 項目 | 想定値 |
| --- | --- |
| Google Form questionCount | 31 |
| 想定 alias 行数（運用ピーク） | ~50 行 |
| 03a sync 頻度 | 1 日 1 回（cron） |
| 07b alias resolve 頻度 | 1〜数件 / 月（admin manual） |

### 試算

| 操作 | 頻度 | 単発 | 1 日 | 月次 | 無料枠 |
| --- | --- | --- | --- | --- | --- |
| `schema_aliases` INSERT | ~5/月 | 1 row write | — | ~5 | 100k row writes/day |
| `schema_aliases` SELECT（03a 内 lookup） | 31 lookup × 1/日 | 31 reads（INDEX） | 31 | ~930 | 5M row reads/day |
| `schema_questions` SELECT（fallback） | hit のみ | <31 | ≤31 | ≤930 | 同上 |
| ストレージ | ~200B × 50 行 | ~10 KB | — | — | 5 GB |

**結論**: 全項目で無料枠の 0.1% 未満。最悪ケース（全 miss）でも 31 + 31 = 62 reads / 日。

### read 増加 bound

03a sync の lookup は aliases hit 後に schema_questions fallback を走らせない短絡評価（Phase 5 pseudo code 確認済）。

## secret hygiene チェックリスト

| # | 項目 | 結果 | 根拠 |
| --- | --- | --- | --- |
| 1 | 新規 secret 追加 | NO | artifacts.json `secrets_introduced: []` |
| 2 | 既存 `GOOGLE_*` secret 利用範囲変更 | NO | 03a Forms API path 変更なし |
| 3 | D1 binding 名は既存流用 | YES | wrangler.toml 踏襲 |
| 4 | コミット予定ファイルに `op://` 以外の値含まれない | YES | DDL/repository/test に secret 不要 |
| 5 | `.env` 中身を AI/log 転記しない | YES | CLAUDE.md 禁止事項を Phase 5 で明記 |
| 6 | wrangler 直接実行禁止 / `scripts/cf.sh` 経由 | YES | Phase 5/11 全 D1 コマンドが scripts/cf.sh |
| 7 | API token / OAuth token を出力転記しない | YES | runbook が op 参照のみ |

## a11y

本タスクは `NON_VISUAL`（DB 配線のみ）→ **直接の a11y 検証対象 0 件**。

将来 admin UI 用ガイドライン（Phase 12 へ引き渡し）:

| 要件 | 内容 |
| --- | --- |
| label | 全 input に `<label for="...">` |
| role | `<button type="submit">` 使用、`<div role="button">` 禁止 |
| aria-describedby | エラー時に input と関連付け |
| keyboard | tab order: question_id → stable_key → source select → submit → cancel |
| focus management | submit 成功後は次行へ自動移動、失敗時はエラー領域へ |
| contrast | WCAG 2.1 AA（4.5:1）以上 |
| announce | submit 結果を `aria-live="polite"` で通知 |

## lint rule（CI 組込案）

```bash
# verify-no-direct-stable-key-update.sh
#!/usr/bin/env bash
set -euo pipefail
HITS=$(rg -n --glob 'apps/**/*.ts' \
  'UPDATE\s+schema_questions\s+SET\s+stable_key' \
  || true)
if [[ -n "${HITS}" ]]; then
  echo "::error::Direct UPDATE on schema_questions.stable_key is forbidden (issue #191 / invariant #14)" >&2
  echo "${HITS}" >&2
  exit 1
fi
```

- 配置: `.github/workflows/verify-invariants.yml` に 1 step 追加
- 失敗時 job 名: `verify-no-direct-stable-key-update`
- 例外: `apps/api/migrations/**` 対象外

副次効果: Phase 7 AC-4 の自動 PASS 判定が CI で恒常化。

## 不変条件 再点検

| # | 結果 | 根拠 |
| --- | --- | --- |
| #1 | PASS | alias を専用テーブル分離、コード側に stableKey 直書きなし。`aliasLabel` で出自 snapshot のみ記録 |
| #5 | PASS | repository / migration / type 全て apps/api 配下。`apps/web` から schema_aliases を直接参照しない |
| #14 | PASS | 書き込み経路は既存契約互換の `POST /admin/schema/aliases` のみ、03a は read-only fallback |

## 次 Phase（10: 最終レビュー）への引き渡し

- 無料枠余裕、secret 新規なし、不変条件 PASS、lint rule CI 組込案
- blocker 候補: なし
- open: lint rule を本タスク Phase 5 ランブックに含めるか別 issue で CI 整備するかは Phase 10 で最終判断
