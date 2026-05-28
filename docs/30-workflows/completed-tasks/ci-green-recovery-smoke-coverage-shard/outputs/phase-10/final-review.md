# Phase 10 確定事項サマリ — 最終レビュー

PR 前の最終ゲート。Phase 1 の AC-1〜AC-9 を正本として 1 つずつ充足判定する基準を確定。すべて expected（実装後に埋める判定基準）。

## AC 充足判定（lane / evidence / PASS 基準）

| AC | lane | evidence（expected） | PASS 基準 |
|---|---|---|---|
| AC-1 | A | admin-list/me-* PASS ログ + mint(TTL=600s) workflow 構造 | 4 チェック PASS かつ bearer が mint 由来 |
| AC-2 | A | G-3 parity test | 全 case green |
| AC-3 | A | G-9 redaction grep（C-1〜C-5） | 全 0 件、mask 構造あり |
| AC-4 | A | mint step `if:` + fallback 経路 | 鍵未設定で静的 bearer に分岐 |
| AC-5 | C | G-5 actionlint + 突合 | exit 0、token 明示、縮退なし |
| AC-6 | B/C | shard 全成功 run の coverage-gate green | `--no-run` exit 0、MISSING なし |
| AC-7 | B/C | step 順序入替 + メッセージ | shard 失敗時に upstream 失敗を先出し、MISSING 誤検知なし |
| AC-8 | 全体 | context 名不変確認 | branch protection と一致 |
| AC-9 | 全体 | G-1/G-2/G-3/G-4 | 4 gate exit 0 |

## blocker 判定基準

- BLOCKER: AC-1/2/3/5/7/9 のいずれか FAIL → PR せず差し戻し。
- NON-BLOCKER: AC-4 fallback がドライ確認止まり → 構造的成立確認で可、実再現はユーザー運用。
- 運用 gated（スコープ外）: secret 5 種実投入・即時再発行 → runbook 記載のみ、ユーザー承認後実行。
- 設計時点で BLOCKER 想定なし（Phase 3 で CRITICAL/HIGH 全反映済み）。

## required status context 名 不変

- `coverage-gate` / `coverage-gate-shard (packages)` / `runtime smoke staging / smoke` の job 名・workflow 名・matrix 値を変更しない。
- step 追加・並べ替え・permissions 追加・token 明示は context 名に影響しない。
- `gh api .../branches/dev/protection` で read-only 突合（変更しない）。

## secret 非転記 最終確認

- 仕様書全体・runbook・helper/workflow/runner・PR 本文に secret 実値/JWT/鍵を含めない。
- runbook は op 参照 + 手順のみ。PR 本文は `::add-mask::` 方針を文章説明に留める。

## 総合判定

AC 全 PASS / blocker なし / context 名不変 / secret 非転記遵守 / 因果ループ（bearer 失効・MISSING 誤検知）が構造的に閉じる、を満たした場合のみ Phase 11→12→13（PR はユーザー承認後）へ進む。
