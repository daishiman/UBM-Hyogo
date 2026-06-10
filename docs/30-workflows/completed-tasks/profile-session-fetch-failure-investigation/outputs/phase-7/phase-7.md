# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| workflow_id | `profile-session-fetch-failure-investigation` |
| taskType | VISUAL |
| implementation_mode | `new` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_evidence_captured` |

## 目的

Phase 6 で確定したテスト群が、本サイクルで **変更・新規追加するブロックに限定**して line / branch を充足することを、対象ファイル・対象関数・実測予定値の表で固定する。カバレッジ目標は apps 全体の一律閾値ではなく、**T01（区別分岐・写像純関数）/ T02（構造化ログ）が触れる関数・分岐に限定**して評価する（広域指定にしない）。T03 診断スクリプトは shell のため vitest カバレッジ対象外とし、`bash -n` / `--help` exit で別途担保する。

## 実行タスク

### 7.1 カバレッジ対象範囲（限定スコープ）

| タスク | 変更/新規ファイル | カバレッジ評価対象ブロック | 評価対象外 |
| --- | --- | --- | --- |
| T01 | `apps/web/src/lib/server-fetch/profile-session-cause.ts`（新規） | `resolveProfileSessionCause` 全分岐（410 / 5xx 正規表現 / FAILED / 既定 unknown） | なし（全行が新規対象） |
| T01 | `apps/web/app/(member)/profile/page.tsx`（編集） | デフォルト失敗分岐（現 66-74）の `resolveProfileSessionCause` 呼び出し + `SectionError` への `cause`/`detail` 受け渡し | 404 分岐（53-63）・401 redirect（46-47）・`meResult.ok` 以降の本体描画（既存・無変更） |
| T01 | `apps/web/src/components/member/SectionError.tsx`（編集） | `data-cause={cause}` 出力（`cause` 有/無の描画差） | 既存 title/detail/retryHref/action 描画（無変更） |
| T02 | `apps/web/src/lib/server-fetch/safe-fetch.ts`（編集） | 追加した `logServerFetchFailure` 本体（status 抽出 / payload 整形 / `console.error`）+ 失敗パスでの呼び出し | 既存 `normalizeError` / `statusFromError` / `shouldRethrow`（無変更。ただし新規 status 経路は LG で被覆される） |
| T02 | `apps/web/app/(member)/profile/page.tsx`（編集） | `/me` 呼び出しへの `path:"/me"` 引数追加（1 行） | 同上（他オプションは無変更） |

### 7.2 変更ブロックの line / branch 実測予定値

| 対象ブロック | 関数 / 箇所 | line 予定 | branch 予定 | 充足テスト |
| --- | --- | --- | --- | --- |
| 写像純関数 | `profile-session-cause.ts` `resolveProfileSessionCause` | 100%（全 return 到達） | 100%（410 / 5xx 正規表現 truthy・falsy / FAILED / 既定 の全分岐） | CC-1〜CC-8 |
| profile デフォルト分岐 | `page.tsx` 失敗分岐（cause/detail 写像 + 描画） | 100% | 100%（410 / 5xx / FAILED の各 `data-cause` 経路） | PF-1 / PF-2 / PF-3 |
| profile 回帰分岐 | `page.tsx` 404 CTA / 401 rethrow | 100%（既存・無変更だが被覆維持） | 100%（404 / 401 / それ以外） | PF-4 / PF-5 |
| SectionError cause 出力 | `SectionError.tsx` `data-cause={cause}` | 100% | 100%（`cause` 有 / 無の 2 経路） | SE-1 / SE-2 |
| 構造化ログ | `safe-fetch.ts` `logServerFetchFailure` | 100% | 100%（`err instanceof Error` 有/無 = status 数値/null / `path` 有/無） | LG-1〜LG-4 / LG-8 |
| ログ呼び出しガード | `safe-fetch.ts` 失敗パス（rethrow 後 vs 通常失敗） | 100% | 100%（rethrow → 非出力 / 通常失敗 → 出力 / 成功 → 非出力） | LG-5 / LG-6 |

> line/branch は上表のとおり **変更ブロックで 100%** を充足予定値とする。新規追加コード（写像純関数・ログ関数）と編集分岐はすべて Phase 6 のテストで分岐被覆されるため、未到達分岐を残さない設計とする。5xx 判定の正規表現 `/_(?:5\d\d)$/` の境界（500/599 truthy・404/400 falsy）は CC-2〜CC-4 / CC-7 / CC-8 で両側被覆する。

### 7.3 coverage-guard 整合

- `bash scripts/coverage-guard.sh --changed` は変更行に対する被覆を判定する。本サイクルの変更行（写像純関数 / page デフォルト分岐 / SectionError 1 行 / safe-fetch ログ / page の path 引数）はすべて 7.2 の対象ブロックに含まれ、Phase 6 のテストで到達するため、changed-line coverage は閾値を割り込まない。
- sync-merge の merge commit は CLAUDE.md 記載のとおり coverage-guard を自動スキップする対象であり、本タスクの feature commit には適用される。
- T03 診断スクリプト（shell）は coverage-guard（ts/tsx 対象）の評価外。`bash -n` 構文と `--help` exit で担保する。

### 7.4 カバレッジ計測コマンド（限定実行）

| 対象 | コマンド |
| --- | --- |
| T01/T02 (web) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage "src/lib/server-fetch/__tests__/profile-session-cause.spec.ts" "app/(member)/profile/page.spec.tsx" "src/components/member/__tests__/SectionError.spec.tsx" "src/lib/server-fetch/__tests__/safe-fetch.spec.ts"` |

計測後、`coverage/` レポートで 7.1 の対象ファイル（`profile-session-cause.ts` / `page.tsx` 失敗分岐 / `SectionError.tsx` cause 出力 / `safe-fetch.ts` ログ）**のみ**を確認し、7.2 の line/branch 予定値（変更ブロック 100%）と一致することを判定する。`page.tsx` の本体描画や `safe-fetch.ts` の既存関数は変更対象外として評価から除外する。

## 完了条件

- [x] カバレッジ評価対象を変更ファイル / 変更ブロックに限定（広域一律指定にしない）
- [x] 各変更ブロックの line / branch 実測予定値（変更ブロック 100%）と充足テストを対応付け
- [x] 5xx 正規表現の境界（500/599 truthy・404/400 falsy）両側被覆を明示
- [x] coverage-guard（changed-line）との整合・T03 shell の評価外を明示
- [x] 限定スコープのカバレッジ計測コマンドを固定

## 成果物

- `outputs/phase-7/phase-7.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 系 path 一覧（変更対象外の境界確認） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 分岐（区別分岐の根拠） |

- `outputs/phase-6/phase-6.md`（テストケース CC/PF/SE/LG）
- `outputs/phase-5/phase-5.md`（変更ファイル俯瞰）

## 統合テスト連携

7.2 の変更ブロック被覆を Phase 9 の品質保証（typecheck/lint/対象 vitest 一括）と同時に確認し、未到達分岐ゼロを最終レビュー（Phase 10）の AC-7（spec で固定）/ AC-3・AC-4 充足判定へ引き継ぐ。
