# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証（free-tier / secret hygiene / a11y / 不変条件再点検） |
| Wave | 3 |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 8（DRY 化） |
| 次 Phase | 10（最終レビュー） |
| 状態 | spec_created |
| GitHub Issue | #191（CLOSED） |

## 目的

Phase 8 までで確定した設計・実装・正規化が、Cloudflare 無料枠 / secret hygiene / a11y / 不変条件 (#1 / #5 / #14) のいずれにも違反しないことを定量・定性両面で点検し、Phase 10 の GO/NO-GO 判定に必要な根拠を提供する。

## 実行タスク

1. D1 無料枠への影響を row 数 / read / write 単位で見積もる
2. secret 追加有無をチェックリスト形式で確認
3. a11y ガイドライン（将来の admin UI 用）を文書化
4. lint rule（`UPDATE schema_questions SET stable_key` 検出）の CI 組込案を確定
5. 不変条件 #1 / #5 / #14 を改めて PASS 判定し根拠を記録

## Cloudflare D1 無料枠 影響見積もり

### 前提値

| 項目 | 想定値 |
| --- | --- |
| Google Form questionCount | 31 |
| 想定 alias 行数（運用ピーク） | ~50 行（schema 改訂を見越した上限） |
| 03a sync 頻度 | 1 日 1 回（cron） |
| 07b alias resolve 頻度 | 1 〜 数件 / 月（admin manual） |

### 試算

| 操作 | 頻度 | 単発コスト | 1 日合計 | 月次合計（30 日） | 無料枠（参考） |
| --- | --- | --- | --- | --- | --- |
| `schema_aliases` INSERT（07b） | ~5 / 月 | 1 row write | — | ~5 row write | 100k row writes/day |
| `schema_aliases` SELECT（03a sync 内 lookup） | 31 lookup × 1 / 日 | 31 row reads（INDEX 経由） | 31 row reads | ~930 row reads | 5M row reads/day |
| `schema_questions` SELECT（fallback） | hit 件数のみ | <31 row reads | ≤31 row reads | ≤930 row reads | 同上 |
| ストレージ | 行サイズ ~200 byte × 50 行 | ~10 KB | — | — | 5 GB |

**結論**: 全項目で無料枠の 0.1% 未満。schema_aliases 追加による 03a sync の row reads 増加は最大 31 行/日（lookup 1 回 = 1 indexed read として概算）であり、全く有意でない。

### read 増加の bound 確認

03a sync の lookup が aliases hit 後に `schema_questions` fallback を走らせない（短絡評価）ことを Phase 5 ランブックの pseudo code で再確認済み。最悪ケース（全件 miss）でも 31 + 31 = 62 row reads / 日。

## secret hygiene チェックリスト

| # | 項目 | 結果 | 根拠 |
| --- | --- | --- | --- |
| 1 | 本タスクで新規 secret を追加するか | NO | artifacts.json `secrets_introduced: []` |
| 2 | 既存 `GOOGLE_*` secret の利用範囲を変更するか | NO | 03a sync の Forms API 呼び出し path 変更なし |
| 3 | D1 binding 名は既存を流用するか | YES | 既存 `wrangler.toml` の binding を踏襲 |
| 4 | コミット予定ファイルに `op://` 参照以外の値が含まれないか | YES（含まれない） | DDL / repository / test に secret 不要 |
| 5 | `.env` の中身を AI / log に転記しないルール遵守 | YES | CLAUDE.md 禁止事項を Phase 5 ランブックでも明記 |
| 6 | wrangler 直接実行を禁じ `scripts/cf.sh` 経由に統一 | YES | Phase 5 / 11 の全 D1 コマンドが `bash scripts/cf.sh` 経由 |
| 7 | API token / OAuth token 値を出力に転記しない | YES | runbook が値を `op://Vault/...` 参照のみで表記 |

## a11y（accessibility）

### 本タスクの a11y 対象

本タスクは `NON_VISUAL`（DB マイグレーション + repository 配線）であり、UI 変更を含まない。**直接の a11y 検証対象は 0 件**。

### 将来の admin UI 用 a11y ガイドライン（参考文書化）

07b の admin UI（alias resolve form）が将来追加される際、以下のガイドラインに従うことを Phase 12 ドキュメントに引き渡す:

| 要件 | 内容 |
| --- | --- |
| label | 全 input に `<label for="...">` を関連付け、`aria-labelledby` 重複を避ける |
| role | form は role 暗黙、submit ボタンは `<button type="submit">` を使用（`<div role="button">` 禁止） |
| aria-describedby | エラーメッセージ表示時、該当 input に `aria-describedby` で関連付け |
| keyboard | tab order が「question_id 表示 → stable_key 入力 → source select → submit → cancel」に整列 |
| focus management | submit 成功後は次の unresolved 行へ focus 自動移動、失敗時はエラー領域へ focus |
| contrast | WCAG 2.1 AA（4.5:1）以上、stable_key 候補表示の disabled 色も基準クリア |
| announce | submit 結果を `aria-live="polite"` で SR 通知 |

> 上記は本タスクでは実装しない（scope out）。Phase 12 で「07b admin UI 追加 issue 起票時の checklist」として参照可能にする。

## lint rule（CI 組込案）

### 検出ルール

```
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

### CI 配置

- `.github/workflows/verify-invariants.yml` に 1 step 追加（既存 `verify-*` 系列に組み込む）
- 失敗時の job 名: `verify-no-direct-stable-key-update`
- 例外: `apps/api/migrations/**` は対象外（DDL 内の `UPDATE` は除外）

### 副次効果

Phase 7 AC-4 の自動 PASS 判定が CI で恒常化する。

## 不変条件 再点検（PASS 根拠 each）

| 不変条件 | 再点検結果 | 根拠 |
| --- | --- | --- |
| #1（実フォーム schema をコードに固定しすぎない） | PASS | alias を専用テーブルに分離し、コード側は `stableKey` 値の直書きを持たない。`SchemaAlias.aliasLabel` で出自 snapshot のみ記録 |
| #5（D1 直接アクセスは apps/api のみ） | PASS | repository / migration / type 全てが `apps/api/` 配下。`apps/web` から `schema_aliases` を直接参照するコードは追加しない |
| #14（schema 変更は /admin/schema に集約） | PASS | 書き込み経路は既存契約互換の `POST /admin/schema/aliases` のみ。03a は read-only で fallback 解決 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 本 Phase 全体まとめ |
| チェックリスト | outputs/phase-09/secret-hygiene.md | secret 確認結果 |
| CI script | outputs/phase-09/verify-no-direct-stable-key-update.sh.draft | lint rule 草案 |

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] D1 無料枠影響が row 数・read/write 単位で定量化されている
- [ ] secret hygiene チェックリスト 7 項目すべてに結果と根拠
- [ ] a11y ガイドラインが将来 admin UI 用に文書化（本タスクは NON_VISUAL）
- [ ] lint rule 草案がコマンドレベルで提示されている
- [ ] 不変条件 #1 / #5 / #14 が PASS 根拠付きで再記載
- [ ] artifacts.json の phase 9 が `spec_created`

## 参照資料

- 必須: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- 必須: `docs/00-getting-started-manual/specs/08-free-database.md`
- 参考: WCAG 2.1 AA（外部参照、a11y guideline 用）

## 次 Phase への引き渡し

- 引き継ぎ事項: 無料枠余裕、secret 新規追加なし、不変条件 PASS 根拠、lint rule の CI 組込案
- blocker 候補: なし（全項目 PASS）
- open question: lint rule を本タスク Phase 5 ランブックに含めるか、別 issue で CI 整備するか — Phase 10 で最終判断
