# Phase 6 — テスト拡充（fail path / 回帰ガード）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 6.1 方針

Phase 4 の正常系（Green 駆動）に加え、**ドリフト検知（fail path）** と **境界・回帰ガード** を拡充する。
意匠の継続整合（4 条件「運用性」）を test で閉じることが目的。本 wave で実装済み。

## 6.2 fail path / ドリフトガード

| # | ガード | 担当テスト | 内容 |
| --- | --- | --- | --- |
| G-1 | tokens.css ドリフト時 fail | `og-tokens.spec.ts`（TC-OGT-02..10） | 正本 `tokens.css` のブランド hex が将来変わった場合、`toBe` が不一致で fail → OG 側 `OG_BRAND` 未追従を CI（`apps/og` vitest）が検出。強化ループ（Phase 2 §2.7）の機械化 |
| G-2 | tokens.css パス不在 fail | `og-tokens.spec.ts`（TC-OGT-01） | 正本ファイルが移動/改名された場合 `existsSync` false で明示 fail（サイレントパスし無検証になる事故を防止） |
| G-3 | 青系 ad-hoc hex 回帰 | `render-html.spec.ts`（TC-HTML-05） | `#0068a9`/`#172033`/`#526070`/`#f8fafc`/`#c9d6e2` の再混入を `not.toContain` で検出 |
| G-4 | literal hex 直書き回帰 | `render-html.spec.ts`（TC-HTML-04） | 正本 hex が `OG_BRAND` 経由で出力されることを assert（render.tsx へ literal を戻す回帰を間接検出） |

## 6.3 境界・視認性ガード（AC-3）

| # | ガード | 担当テスト | 内容 |
| --- | --- | --- | --- |
| B-1 | 長い氏名で font 縮小 | `og-tokens.spec.ts`（TC-OGT-13..15） | 15 文字 →64 / 28 文字 →64 / 29 文字 →54。長い日本語氏名がカードからはみ出さない適応サイズ |
| B-2 | 短い title は最大サイズ | `og-tokens.spec.ts`（TC-OGT-11..12） | 14 文字以下 →76（"UBM 兵庫支部会" 含む default も最大） |
| B-3 | code point 計測の正しさ | `og-tokens.spec.ts`（TC-OGT-16） | サロゲートペアでも 1 文字 = 1 code point として計測（`[...title].length`） |
| B-4 | subtitle 非空保証 | `render-html.spec.ts`（TC-HTML-08） | フィールド欠落時も `tagLine` が "UBM Hyogo member" を返し subtitle が非空（member なし表示崩れ防止） |
| B-5 | HTML escaping 維持 | `render-html.spec.ts`（TC-HTML-03 + 既存 escapeHtml describe） | `<` `&` `"` のエスケープが改修後も維持（XSS/HTML 破壊防止の非回帰） |

## 6.4 既存テストの非回帰維持

意匠改修は `render.tsx` の `buildHtml` 内 inline style と新規 `og-tokens.ts` に閉じる。以下の既存スイートは **変更せず PASS を維持**することを Phase 6 の確認項目とする（AC-6）。

| 既存テスト | 対象 | 改修の影響 | 期待 |
| --- | --- | --- | --- |
| `router.spec.ts` | ルーティング（`/og/...` 等の dispatch） | なし（render.tsx の経路・export 不変） | 全 PASS 維持 |
| `member-source.spec.ts` | `fetchMemberSummary` / `tagLine` / `toMemberSummary`（member fetch・binding/baseUrl 経路・timeout） | なし（member-source.ts 非変更） | 全 PASS 維持 |
| `router-error.spec.ts` | エラー時 fallback / 異常応答ハンドリング | なし（`renderStaticFallbackOg` 経路不変） | 全 PASS 維持 |
| `render-smoke.spec.ts` | default / member OG の PNG 応答（fallback path） | 契約不変（TC-SMOKE-01） | 全 PASS 維持 |

> 既存 `tagLine` のフォールバック仕様（"UBM Hyogo member"）と escapeHtml 仕様は本タスクで変更しない。これらに依存する member-source.spec.ts / render-html.spec.ts のケースは不変のまま残す。

## 6.5 Phase 6 完了条件

- fail path（G-1..G-4）・境界（B-1..B-5）が Phase 4 の TC で網羅されている。
- 既存 4 スイートの非回帰維持が確認項目として明示されている。
- `mise exec -- pnpm --filter @ubm-hyogo/og test` で新規 + 既存が全 PASS。
