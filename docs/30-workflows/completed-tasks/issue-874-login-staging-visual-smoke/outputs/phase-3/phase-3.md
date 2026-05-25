**[実装区分: 実装仕様書]**

# Phase 3: 設計レビュー / Phase 4 進行可否判定 (Gate-A)

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `runtime_pending` |
| Gate | Gate-A (spec_review) |
| 入力 | Phase 1 / Phase 2 |

## 1. 4 条件 verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | spec env-override 既定値は既存 local default 文字列を 1 字も変えず baseline 互換。`playwright.config.ts` の staging project / `PLAYWRIGHT_EVIDENCE_DIR` global rule と整合 |
| 漏れなし | PASS | spec 改修 / shell helper / staging deploy 手順 / smoke 実行 / 7 PNG 取得 / 目視 diff / consumed trace の 7 ステップすべて Phase 2 §4 に明示 |
| 整合性あり | PASS | `spec_created` / `VISUAL` / `new` の状態語彙統一。staging evidence path (`outputs/phase-11/staging-screenshots/`) は他 task と物理衝突なし |
| 依存関係整合 | PASS | staging deploy / smoke 実行 / commit / push / PR を Phase 11 / 13 で user-gated とし、AI が独断で外向き操作する経路 0 件。`scripts/cf.sh` 経由ルール遵守 |

## 2. レビューチェックリスト

| 項目 | 確認 |
|---|---|
| spec 改修が 2 行差分以内に収まり、state assertion を触らない | OK |
| local 既定値文字列が変更されていない（baseline 互換） | OK |
| `playwright.config.ts` への新規変更がない | OK |
| `staging` project / `PLAYWRIGHT_EVIDENCE_DIR` 既存実装の活用が記述済 | OK |
| shell helper が `set -euo pipefail` + shellcheck clean を保証する記述あり | OK |
| `mise exec --` 経由が helper に明記されている | OK |
| `wrangler` 直接呼び出しが helper に含まれない | OK |
| staging evidence path が local baseline と物理的に別ディレクトリ | OK |
| consumed trace 対象 2 ファイルが明示されている | OK |
| AC-6 の deploy user-gated 記述がある | OK |

## 3. 既存実装との整合確認

| 既存資産 | 整合性 |
|---|---|
| `apps/web/playwright.config.ts` の `staging` project (L217-223) | 改変せず流用 → 既存契約維持 |
| `playwright.config.ts` line 48 の `PLAYWRIGHT_EVIDENCE_DIR` global rule | spec 側が直接読むため矛盾なし |
| 親 workflow `completed-tasks/login-page-prototype-alignment/outputs/phase-11/screenshots/` (local 8 PNG) | read-only 参照のみ。改変しない |
| 既存 `scripts/*.sh` パターン（`set -euo pipefail` / `mise exec --` / 引数 fallback） | 同パターンで実装 |
| `scripts/cf.sh` ラッパー | staging deploy 手順で参照、helper には include しない |

## 4. リスク再点検

Phase 1 §9 のリスク 5 件に対し設計上の対策が打たれているか:

| リスク | 対策の所在 | verdict |
|---|---|---|
| staging URL 未設定で空走 | Phase 2 §5 helper contract で必須化・exit 1 | OK |
| local 既定値破壊 | Phase 2 §6 で既定値文字列 1 字保持を明示 | OK |
| cold start flaky | Phase 2 §4 手順 5 で warm-up を明示 | OK |
| staging session cookie 不整合 | Phase 1 §9 で fixture cookie / mock route 利用可否を Phase 5 確認事項として残置 | 残課題（Phase 5 で具体化） |
| 無関係 diff 混入 | Phase 2 §4 手順 4 直前で `git log origin/dev..HEAD` 確認 | OK |

## 5. Gate-A 判定

- 4 条件すべて PASS
- レビューチェックリスト全 OK
- 既存実装との整合 OK
- Phase 5 着手時に「staging session cookie / mock route」の具体化が必要（Phase 5 §1 で扱う）

**Gate-A verdict: PASS → Phase 4 進行可**

## 6. 次 Phase への引き継ぎ

Phase 4 では、本 Gate-A 通過を受けて (a) spec 改修の正確な diff スニペット、(b) shell helper の最終コード、(c) shellcheck コマンド、(d) local smoke (env 未設定) と staging smoke (env 設定) の expected outcome を expected-result 表として確定する。
