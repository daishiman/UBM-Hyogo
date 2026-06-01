# Phase 3: 設計レビュー（Phase 4 へ進めるかの判定）

> issue-1024 — sidebar collapse 状態の cookie 永続化

## 3.1 4 条件評価（一次結論）

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | リロード/再訪時の collapse 状態のちらつきを排除し、開発者・利用者双方の「設定が一瞬戻る」体験コストを下げる。さらに lint 回避 hack を除去し将来の保守コストを下げる |
| 実現性 | PASS | 新規 1 pure module + 既存 4 ファイルの後方互換編集。1 実装サイクルで完了。`cookies()` は repo 利用実績あり |
| 整合性 | PASS | state owner は `useSidebarState` 1 系のまま。SSR seed と client 初期 render が同値（I-7）で hydration mismatch なし。不変条件 I-1〜I-7 と矛盾なし |
| 運用性 | PASS | cookie は端末ローカル UI 設定で監査対象外。lint-boundaries / typecheck / vitest の既存 gate で回帰検出可能。D1 / API surface 不変で運用影響なし |

## 3.2 リスクと対策（D-x）

| # | リスク | 影響 | 対策 |
|---|--------|------|------|
| D-1 | `cookies()` の async/sync が Next バージョンで異なり await 漏れ | server build エラー | Phase 5 で repo 既存 `cookies()`/`headers()` 利用箇所の await パターンに合わせると明記。`await cookies()` を採用 |
| D-2 | client mount で cookie を再読取りすると SSR 値と二重判定し hydration race | ちらつき再発・警告 | seed が boolean のとき mount effect は早期 return（再読取りしない）。`readCollapsedFromDocument` は hook では未使用（Phase 8 で over-export 判定） |
| D-3 | cookie 名に `:` を使うと一部 UA で破棄 | 永続化が無効 | cookie 名は `ubm_shell_collapsed`（RFC 6265 token safe）。localStorage key `ubm:shell:collapsed` とは別名で良い（localStorage 撤廃のため衝突なし） |
| D-4 | localStorage 撤廃漏れ（`STORAGE_NAME` 等が残る） | lint-boundaries fail or hack 残存 | Phase 5 / Phase 9 で `grep -rn "localStorage\|STORAGE_NAME\|getShellStorage" apps/web/src/components/shell/` = 0 件を完了チェックに固定 |
| D-5 | 既存 `useSidebarState.spec.tsx` の localStorage アサーションが残り fail | テスト赤 | Phase 4/6 で当該 spec を cookie アサーションへ更新する手順を明記（既存 4 ケースの置換 + seed ケース追加） |
| D-6 | jsdom で `document.cookie` の `max-age` 削除が即時反映されない等の挙動差 | テスト不安定 | parser は pure 関数で検証（DOM 非依存）。writer は `document.cookie` に name=value が含まれることだけを assert（max-age 削除挙動には依存しない） |
| D-7 | `SidebarShell.server.spec.tsx` が `next/headers` 未 mock で落ちる | テスト赤 | 既存 spec の mock に `cookies` を追加する手順を Phase 4/6 に明記（`vi.mock("next/headers", ...)`） |

## 3.3 因果ループ確認

- 強化ループ: toggle → cookie 書込 → 次回 SSR seed 正 → ちらつき無し（収束）。
- バランスループ: cookie 不在 → server expanded → client md heuristic 1 回補正 → 以降 cookie 確定で抑制。発散しない。

## 3.4 依存・境界の確認

- server（読取り専用）/ client hook（state owner + 書込）/ pure cookie module（I/O 集約）の責務が分離。書込は client のみ、読取り seed は server のみ。二重所有なし。
- 呼出側 3 layout は無改修（境界が server entry に閉じる）。

## 3.5 判定

**PASS — Phase 4 へ進む。** MAJOR 指摘なし。MINOR は D-2 の `readCollapsedFromDocument` over-export（Phase 8 リファクタで再評価＝未タスク化候補にはしない、本サイクル内で判断）。
