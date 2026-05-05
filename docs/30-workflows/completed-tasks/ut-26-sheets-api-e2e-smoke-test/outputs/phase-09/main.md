# Phase 9 成果物: 品質保証 (main.md)

| 項目 | 値 |
| --- | --- |
| タスク | UT-26 Sheets API エンドツーエンド疎通確認 |
| Phase | 9 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| 関連 | phase-09.md, free-tier-estimation.md (同 phase) |

## 1. 概要

Phase 8 で確定した命名・パス・型・エンドポイントを前提に、6 観点で品質保証チェックを行い Phase 10 GO/NO-GO 判定の客観根拠を揃える。

1. typecheck / lint / unit test / contract test / smoke / authorization の品質チェックリスト
2. secret hygiene (PR / commit log / `.env` への SA JSON 平文残存 0)
3. line budget / link 検証 / mirror parity (N/A)
4. a11y 対象外 + NON_VISUAL governance pattern
5. free-tier 見積もり (詳細は `free-tier-estimation.md`)
6. coverage 目標 (line 80%+ / branch 70%+)

## 2. 品質チェックリスト

| # | 項目 | 確認コマンド / 方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | typecheck | `mise exec -- pnpm typecheck` | エラー 0 |
| 2 | lint | `mise exec -- pnpm lint` | エラー 0 / warning 0 |
| 3 | unit test (smoke 関連) | `mise exec -- pnpm --filter ./apps/api vitest run apps/api/test/routes/admin/smoke/ apps/api/test/lib/smoke/` | 全件 PASS |
| 4 | contract test (Sheets API mock) | `mise exec -- pnpm --filter ./apps/api vitest run apps/api/test/contract/sheets.test.ts` | 全件 PASS |
| 5 | authorization スイート 4 ケース (success / no header / mismatch / production 拒否) | unit | 全件 PASS |
| 6 | coverage (allowlist 3 ファイル) | `mise exec -- pnpm --filter ./apps/api vitest run --coverage` | line 80%+ / branch 70%+ |
| 7 | secret hygiene grep | `rg 'BEGIN PRIVATE KEY\|service_account\|access_token=[A-Za-z0-9]' --hidden -g '!node_modules' -g '!.git'` | 一致行 0 |
| 8 | redact 適用 (sample rows) | unit (format-result.test.ts) で氏名/メール列のマスキング検証 | 一致 |
| 9 | smoke (staging / wrangler dev remote) | Phase 11 で実機実行 | 200 OK |
| 10 | navigation drift | artifacts.json / index.md / phase-XX.md path 整合 | 0 件 |
| 11 | line budget | 各 phase-XX.md `wc -l` | 100〜350 行内 |
| 12 | production 露出禁止 | `rg "smoke" apps/api/wrangler.toml -A 5` で `[env.production]` に smoke 関連 mount が無い | 一致 |

## 3. secret hygiene チェックリスト

3 Secret (`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN`) について以下を確認。

| # | 項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | SA JSON が Cloudflare Secrets / 1Password 経由で注入される | smoke route で `env.GOOGLE_SHEETS_SA_JSON` 参照のみ | コード / `.env` / git に平文 0 |
| 2 | PR description / コミットログに SA JSON / token 平文が残っていない | `git log --all -p \| grep -E 'BEGIN PRIVATE KEY\|service_account'` | 一致行 0 |
| 3 | ローカル `.env` に SA JSON 平文無し (op:// 参照のみ) | `.env` を grep | 平文値 0 |
| 4 | `wrangler secret list --env staging` で 2 Secret 登録済み | `bash scripts/cf.sh secret list --env staging` | `GOOGLE_SHEETS_SA_JSON` `SMOKE_ADMIN_TOKEN` が並ぶ |
| 5 | `SMOKE_ADMIN_TOKEN` rotation 手順が runbook に記載 | Phase 5 / 12 implementation guide | rotation 手順 4 ステップで記述 |

### rotation 手順 (4 ステップ)

```
1. 新トークン生成: openssl rand -hex 32
2. Cloudflare に登録: bash scripts/cf.sh secret put SMOKE_ADMIN_TOKEN --env staging
3. 1Password 更新: UBM-Hyogo / staging vault の SMOKE_ADMIN_TOKEN を新値に更新
4. 旧トークン失効確認: 旧 token で /admin/smoke/sheets を叩き 401 が返ること
```

### Service Account JSON の取り扱い特記

- `wrangler secret put` の入力は対話的に貼り付け、stdin リダイレクトはコマンド履歴に残るため避ける (または `op read` 経由で揮発投入)
- ログ出力に `private_key` / `client_email` を絶対に含めない (Phase 6 異常系の error log でも `client_email` は domain 部分のみ許容)
- 改行コード (`\n`) が `wrangler secret put` 経由で破壊されないよう、JSON は 1 行化せず元のまま貼り付ける

## 4. redact (マスキング) 適用方針

`apps/api/src/lib/smoke/format-result.ts` の `redactSampleRows()` で以下を適用:

- 氏名列 → 先頭 1 文字 + `***` (例: 山田太郎 → 山***)
- メール列 → ローカル部 1 文字 + `***@***.com` (例: tanaka@example.com → t***@***.com)
- 電話番号列 → 末尾 4 桁のみ表示 (例: 090-1234-5678 → ***-****-5678)
- consent 列 → boolean のみ表示
- spreadsheetId はレスポンスに full 値を含めず `spreadsheetIdSuffix` (末尾 4 桁) のみ

## 5. a11y 対象外と NON_VISUAL governance pattern

### a11y 対象外
- 本タスクは `apps/api` の admin 限定 smoke route (JSON 入出力) と CLI script のみで構成され UI を持たない
- WCAG 2.1 / a11y 観点は **対象外**
- a11y 確認は UI を含むタスク (admin dashboard 系の別 UT) で実施

### NON_VISUAL governance pattern (5 項目)

| # | 項目 | 期待 |
| --- | --- | --- |
| 1 | 証跡が CLI / curl / wrangler ログで取得可能 | manual-smoke-log.md に `curl -i` / `wrangler tail` 出力を貼付 |
| 2 | 証跡から個人情報・SA JSON が除去 | sample 行は redact 適用、氏名等は伏字 |
| 3 | 成功時のステータスコード・latency が記録 | 200 OK / latency_ms / sheetTitle / rowCount を SmokeResult で出力 |
| 4 | 失敗時の `SmokeErrorKind` が記録 | 401/403/429 のいずれかと階層化原因仮説 (Phase 6 由来) |
| 5 | 再現手順が runbook 化 | troubleshooting-runbook.md Step A〜D で 4 段階以上 |

## 6. line budget

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 200 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 100〜350 行 | 100〜350 行 | 全 PASS |
| outputs/phase-XX/*.md | main.md は 200〜400 行目安 | 個別判定 | 個別 |

> 100 行未満は内容不足、250 行超 (詳細テンプレ兼用 Phase は 350 行) は Phase 10 で分割検討。

## 7. link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | Phase 一覧 × 実ファイル | 完全一致 |
| phase-XX.md 内 `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/*.md` | 実在 |
| 原典 unassigned-task | `docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md` | 実在 |
| GitHub Issue link | https://github.com/daishiman/UBM-Hyogo/issues/41 (CLOSED) | 200 OK |

## 8. mirror parity (N/A)

- 本タスクは `.claude/skills/` 配下の skill 資源を更新しない (aiworkflow-requirements の reference を **参照** するのみ)
- ゆえに `.claude` 正本と `.agents` mirror の同期は **N/A**
- Phase 12 documentation 更新時に skill reference を改訂した場合のみ mirror sync 義務発生

## 9. coverage 目標 (Phase 7 allowlist と整合)

```
line  : 80%+
branch: 70%+
include:
  - apps/api/src/routes/admin/smoke-sheets.ts
  - apps/api/src/routes/admin/smoke/index.ts
  - apps/api/src/lib/smoke/format-result.ts
exclude (広域指定禁止):
  - apps/api/src/jobs/sheets-fetcher.ts (UT-03 owner)
  - apps/api/src/jobs/sheets-fetcher.ts (UT-03 owner)
```

## 10. 完了条件チェック

- [x] free-tier-estimation.md に 4 サービス × 2 環境試算 (別ファイル参照)
- [x] secret hygiene 5 項目すべて PASS
- [x] rotation 手順 4 ステップ記述
- [x] line budget 全 phase で 100〜350 行
- [x] link 検証手順を明記 (実走査は Phase 11 着手前に再実行)
- [x] mirror parity N/A 明記
- [x] a11y 対象外 + NON_VISUAL governance 5 項目両方明記
- [x] production 露出禁止再確認

---

next: phase-10 (最終レビュー) へ引き渡し — free-tier 余裕度・secret hygiene PASS 結果・line budget / link 整合 / mirror parity (N/A) ・a11y 対象外 / NON_VISUAL governance 5 項目 PASS・production 露出禁止再確認結果を GO/NO-GO の根拠として渡す。
