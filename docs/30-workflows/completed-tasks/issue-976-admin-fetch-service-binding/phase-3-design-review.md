# Phase 3 — 設計レビュー

## 自己レビュー

- [x] public.ts と admin server-fetch の対称性: 同一の "service-binding 最優先 / test fallback" モデルに統一できる
- [x] 既存 fixture 経路は env-gated 早期 return で fetchAdmin 上流に存在し、service-binding 切替の影響を受けない
- [x] `safe-server-fetch.ts` は `fetchAdmin` を wrap するだけなので signature 変更不要
- [x] `safe-server-fetch-404-vs-401.spec.ts` 等の既存 spec は HTTP fetch mock 前提だが、test runtime では HTTP fallback に流れるため変更不要
- [x] CLAUDE.md #5 (D1 直接アクセス禁止): API 経由を維持。service-binding は API Worker への RPC fetch なので不変条件に違反しない

## リスク

| リスク | 影響 | 対応 |
|--------|------|------|
| service-binding が cookie ヘッダを期待通り転送しない | admin auth 失敗 | spec で cookie header 透過を assert + staging runtime evidence で検証 |
| `getEnv()` parse 失敗時に throw → SSR error boundary 経由になる | 既存挙動と同じ(invariant) | 変更なし |
| Workers runtime 以外で `API_SERVICE` が undefined のまま fetch 経路に流れる | test 環境で fetch mock 経路が動作する想定通り | `isTestOrPlaywright()` で明示分岐 |
| 既存 admin spec の mock 設計が壊れる | CI fail | test runtime では必ず HTTP fetch fallback を選ぶよう分岐順序を保証(spec 追加で gate) |

## 既存 issue / 完了タスクとの関係

- `admin-requests-prototype-alignment-and-404-fix` `admin-identity-conflicts-prototype-alignment-and-404-fix` `admin-tag-queue-ui-and-404-recovery` `admin-ui-prototype-alignment-followup-001-members-fetch-and-visual` — いずれも症状緩和(UI 側 narrow warn / fixture)で根本未対応。本タスクはそれらの上位で経路自体を修正する
- `feat/fix-admin-fetch-cf-1042-service-binding` ブランチ — 同じ意図で作られたが実装未着手。本仕様で吸収

## エスカレーション不要事項

- API 側 0 変更で完結
- D1 schema 変更なし
- 1 ファイル + 1 spec の最小スコープ → CONST_007 (1 サイクル内完了) 満たす
