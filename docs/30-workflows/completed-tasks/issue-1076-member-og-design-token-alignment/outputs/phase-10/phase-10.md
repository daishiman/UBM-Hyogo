# Phase 10 — 最終レビュー

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 10.1 受け入れ条件 達成判定

`implemented_local_evidence_captured` として、Phase 9 のローカル品質ゲート実走結果を基準に判定する。

| AC | 内容 | 設計上の達成手段 | 判定 |
| --- | --- | --- | --- |
| AC-1 | OG 配色を OKLch トークン正本（tokens.css）と整合 | `OG_BRAND` を tokens.css 確定 hex から複製（Phase 2 §2.3）。`og-tokens.spec.ts` が正本一致を assert・`render-html.spec.ts` が青系 hex 不在を assert・grep 0 件確認（Phase 9 §9.2/§9.4） | PASS |
| AC-2 | レイアウトをトークン整合（spacing / radius / 階層） | `buildHtml` を `OG_LAYOUT` 由来へ整理（Phase 2 §2.4 / Phase 8 §8.2）。本文 magic 値を排除 | PASS |
| AC-3 | member 名あり/なし両ケースで視認性担保 | `titleFontSize(title)` 適応サイズ + 階層（Phase 2 §2.5）。default / occupation 有 / フォールバックの 3 ケースを `render-html.spec.ts` で網羅 | PASS |
| AC-4 | render smoke test 更新でデグレ防止 | `render-smoke.spec.ts` で default / member 両 OG の PNG 応答維持・`render-html.spec.ts` 拡充（Phase 9 §9.2） | PASS |
| AC-5 | 意匠改善後も OG bundle が Free 3MiB 上限内 | `pnpm --filter @ubm-hyogo/og build` + `check-worker-size.sh apps/og/dist`。size gate 718KiB / 3072KiB | PASS |
| AC-6 | 既存機能（fallback PNG / member fetch / router）非回帰 | 既存 router / member-source / render smoke を含む OG Vitest 6 files / 23 tests PASS | PASS |
| AC-7 | typecheck / lint 緑 | `pnpm --filter @ubm-hyogo/og typecheck` / `pnpm --filter @ubm-hyogo/og lint` | PASS |

## 10.2 blocker 判定

**blocker: なし。** 設計は単一責務・1 サイクル完結（`apps/og` 5 ファイル）・不変条件非抵触（Phase 2 §2.8）・テスト可能性（pure 関数 + 既存 v8-ignore path）を満たし、未確定事項なし（A/B 解釈・整合方式はユーザー確認で確定済み・Phase 3 §3.4）。

## 10.3 MINOR 指摘 / 将来候補（Phase 12 unassigned-task-detection へ送る）

| 指摘 | 種別 | 扱い |
| --- | --- | --- |
| serif 見出しフォント（Noto Serif JP）の追加で OG タイトルにブランド書体を与える意匠強化 | MINOR / 将来候補 | 本タスクスコープ外（Phase 1 §1.5 / Phase 3 §3.2 案 D）。font 追加 fetch によるレイテンシ/複雑性増のため、今回は Noto Sans JP の weight/size/tracking で階層化。**Phase 12 unassigned-task-detection へ将来候補として送る** |
| ランタイム A/B テスト基盤（2 意匠出し分け + 計測） | スコープ外（合意済み） | body AC 外・Free 枠コスト増。ユーザー確認で「単一意匠磨き込み」確定（Phase 3 §3.2 案 C）。必要時に別 Issue |

> 上記 MINOR/将来候補は現サイクルの目的（意匠整合）に不要なため除外する。serif 見出しは Phase 12 の unassigned-task-detection で未タスク候補として記録する旨をここに明記する。

## 10.4 判定

**Phase 11（手動テスト）へ進行可。** AC-1〜AC-7 はローカル品質ゲートで PASS、blocker なし、MINOR は将来候補として Phase 12 へ送る。
