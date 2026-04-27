# Link Checklist — Phase 11 リンク整合確認

## 目的

Phase 11 成果物（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）と前後 Phase（5 / 6 / 8 / 10）成果物・index.md・artifacts.json の参照整合を確認する。

## 確認項目テーブル

| # | 確認項目 | 期待 | 確認方法 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | `index.md` → `phase-11.md` リンク | 有効（Phase 一覧に記載） | `rg -n 'phase-11\.md' docs/30-workflows/ut-12-cloudflare-r2-storage/index.md` | PASS |
| 2 | `phase-11.md` → `outputs/phase-11/main.md` 存在 | ファイル存在 | `ls outputs/phase-11/main.md` | PASS |
| 3 | `phase-11.md` → `outputs/phase-11/manual-smoke-log.md` 存在 | ファイル存在 | `ls outputs/phase-11/manual-smoke-log.md` | PASS |
| 4 | `phase-11.md` → `outputs/phase-11/link-checklist.md` 存在 | ファイル存在 | `ls outputs/phase-11/link-checklist.md` | PASS |
| 5 | Phase 5 (`r2-setup-runbook.md`) → 本 Phase smoke 手順整合 | runbook と smoke-log のコマンドが整合 | `rg -n 'wrangler r2 object' outputs/phase-05/ outputs/phase-11/` | PASS |
| 6 | Phase 5 (`binding-name-registry.md`) → 本 Phase バインディング名 | `R2_BUCKET` で一致 | `rg -n 'R2_BUCKET' outputs/phase-05/binding-name-registry.md outputs/phase-11/manual-smoke-log.md` | PASS |
| 7 | Phase 6（異常系検証ノート）→ 本 Phase 不許可 origin 手順 | curl 不許可 origin 手順と整合 | `rg -n '不許可\|malicious' outputs/phase-06/ outputs/phase-11/manual-smoke-log.md` | PASS |
| 8 | Phase 8 (`dry-applied-diff.md`) → 本 Phase wrangler 設定参照 | `[[r2_buckets]]` バインディング差分と整合 | `rg -n 'r2_buckets' outputs/phase-08/` | PASS |
| 9 | Phase 10 (`review-decision.md`) → 本 Phase PASS 判定 | Phase 11 進行可と整合 | `rg -n 'Phase 11\|smoke' outputs/phase-10/` | PASS |
| 10 | `artifacts.json` `phase: 11` の `outputs` パス整合 | `outputs/phase-11` を指す | `jq '.phases[] \| select(.phase==11)' artifacts.json` | PASS |
| 11 | `screenshots/` ディレクトリ非作成 | 存在しないこと | `test ! -d outputs/phase-11/screenshots && echo OK` | PASS |
| 12 | `.gitkeep` 非作成 | 存在しないこと | `test ! -f outputs/phase-11/screenshots/.gitkeep && echo OK` | PASS |

## 確認方法（参照コマンドの根拠）

- `rg`（ripgrep）: ファイル内のリンク・キーワード検索
- `ls` / `test -d` / `test -f`: ファイル・ディレクトリ存在確認
- `jq`: artifacts.json の機械可読突合

## 総合判定

**PASS** — 全 12 項目で前後 Phase / index.md / artifacts.json との参照整合が確認された。screenshots ディレクトリ・`.gitkeep` も非作成で NON_VISUAL 規約を満たす。
