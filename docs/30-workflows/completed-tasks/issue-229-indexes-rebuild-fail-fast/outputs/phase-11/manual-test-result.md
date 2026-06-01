# manual-test-result — issue-229 generate-index fail-fast smoke 結果

> **PASS**: 今回サイクルで focused Vitest と `pnpm indexes:rebuild` を実走済み。

## 0. 証跡メタ（NON_VISUAL）

| 項目 | 内容 |
| --- | --- |
| 証跡の主ソース | 自動テスト `scripts/__tests__/generate-index-fail-fast.spec.ts`（1 file / 6 tests）+ CLI 回帰（`pnpm indexes:rebuild` の exit code / `git diff` / 失敗注入時の decisive stderr） |
| 副ソース | pre-push `indexes-drift-guard.sh` / CI `verify-indexes.yml` の exit code + drift 検査 |
| スクリーンショットを作らない理由 | NON_VISUAL / CLI tooling。`generate-index.js` は画面・UI・UX を持たず、観測対象は exit code・stderr・出力ファイルの byte 内容のみ。スクリーンショットで観測可能な挙動が存在しない |
| 状態 | PASS |

## 1. 実行サマリ

| 項目 | 値 |
| --- | --- |
| date_utc | 2026-05-31 |
| operator | Codex |
| 実装 PR ref | not created（user-gated） |
| base commit | current worktree HEAD |
| 全体結論 | PASS |

## 2. AC 検証マトリクス

| AC | 検証方法 | 主証跡 | 結果 |
| --- | --- | --- | --- |
| AC-1 途中 throw で非ゼロ exit | helper 失敗注入 / CLI `main().catch(process.exit(1))` 維持 | spec test + source review | PASS |
| AC-2 atomic（部分書き込みなし） | 2 件目 write/rename failure 注入 → 本ファイル不変 + tmp 残存 0 | spec test | PASS |
| AC-3 decisive log | throw 時 message に `[generate-index] aiworkflow-requirements / <index-file> <step> 失敗:` | spec test | PASS |
| AC-4 回帰維持 + byte-identical | `pnpm indexes:rebuild -- --quiet` 後、新規 artifact inventory に伴う topic-map/keywords 更新を生成。直後の 2 回目 rebuild は index diff unchanged | CLI 回帰 | PASS |
| AC-5 silent catch 分離 | ENOENT 継続 / その他 throw | spec test | PASS |
| AC-6 scope 再最適化 | index.md 調査結論レビュー | docs | 記録済み（仕様書） |
| AC-7 回帰 spec test | `pnpm exec vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` | spec test | PASS（6 tests） |
| AC-8 4 条件 PASS | Phase 1 / Phase 3 | docs | PASS（仕様書） |

## 3. 採取データ（今回サイクルで転記）

| 項目 | 値 |
| --- | --- |
| S-1 exit code | 0 |
| S-1 git diff | topic-map/keywords update present for new inventory; second rebuild idempotent |
| S-2 exit code | covered by injected failure unit tests |
| S-2 stderr | `[generate-index] aiworkflow-requirements / ... 失敗: ...` |
| S-3 tmp 残存数 | 0（unit tests） |
| S-4 vitest 結果 | 1 file / 6 tests PASS |
| S-5 pre-push guard exit | not run（`pnpm indexes:rebuild` + second rebuild idempotency で同契約を検証） |

## 4. 失敗時の戻し先

| 状態 | 戻し先 |
| --- | --- |
| S-1 byte-identical FAIL（drift 発生） | Phase 2（設計）/ Phase 8（DRY）— 出力文字列が変わっていないか確認 |
| S-2 / S-3 fail-fast / atomic FAIL | Phase 5（ランブック）— helper 経路を再確認 |
| S-4 spec test FAIL | Phase 6（異常系）/ Phase 4（テスト戦略） |
| S-5 hook 回帰 FAIL | Phase 9（品質保証） |

## 5. 結論

PASS — local implementation and focused evidence captured. Commit / push / PR remain user-gated.
