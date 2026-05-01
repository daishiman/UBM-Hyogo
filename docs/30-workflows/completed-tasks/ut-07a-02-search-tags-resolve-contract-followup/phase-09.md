# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | completed |
| Source Issue | #297 |

---

## 目的

Phase 5〜8 で実装・整理した shared zod schema / apps/web client / 08a contract test を、
typecheck / lint / contract test / dependency-cruiser / free-tier 見積もり / secret hygiene / a11y の 7 観点で
最終 quality gate にかけ、Phase 10 の GO/NO-GO 判定材料を整える。

---

## 実行タスク

1. typecheck / lint / test の最終 pass を確認し evidence（コマンド + 結果サマリ）を記録
2. dependency-cruiser または equivalent な import 健全性チェックで shared package の循環依存を確認
3. free-tier 見積もり（Workers requests / D1 reads / KV ops）を「契約変更のみ」前提で記述
4. secret hygiene（新規 secret 不要）を確認
5. a11y の N/A 理由（NON_VISUAL タスク）を明示
6. shared package import 健全性（apps/web → packages/shared / apps/api → packages/shared の方向のみ）を確認

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-07.md | AC マトリクス / coverage 実測 |
| 必須 | phase-08.md | DRY 化後の構成 |
| 必須 | CLAUDE.md | 不変条件 #5 / #10 |
| 必須 | .github/workflows/ | CI gate 一覧 |
| 参考 | apps/api/wrangler.toml / apps/web/wrangler.toml | binding と limits |

---

## Quality Gate チェック表

| # | 観点 | コマンド / 確認方法 | 期待値 | 判定 |
| --- | --- | --- | --- | --- |
| Q-1 | typecheck | `mise exec -- pnpm typecheck` | エラー 0 件 | pending |
| Q-2 | lint | `mise exec -- pnpm lint` | エラー 0 件 | pending |
| Q-3 | unit / contract test | `mise exec -- pnpm --filter @repo/api test` | 既存 + 新規 4 ケース all green | pending |
| Q-4 | coverage | `pnpm --filter @repo/api test -- --coverage` | line / branch ともに baseline 維持 | pending |
| Q-5 | dependency-cruiser | `pnpm --filter @repo/shared depcheck` または equivalent | 循環依存 0 件 | pending |
| Q-6 | shared import 方向 | `rg "from '@repo/shared'" apps/` | apps/web / apps/api 両方からのみ参照 | pending |
| Q-7 | free-tier 影響 | 後述見積もり表 | 増減 ≒ 0 | pending |
| Q-8 | secret hygiene | 新規 secret 追加なしを `wrangler.toml` 差分で確認 | secret 追加 0 件 | pending |
| Q-9 | a11y | NON_VISUAL のため N/A | N/A 理由明示 | pending |

---

## Free-tier 見積もり

| リソース | 算出 | 増減 | 備考 |
| --- | --- | --- | --- |
| Workers requests | resolve API は admin オペレーション、想定呼び出し数は変更前後で同一 | ±0 | 契約変更のみで volume 影響なし |
| D1 reads | tag_assignment_queue / tag_definitions / member_tags への read 件数は同等 | ±0 | route 実装は 07a Phase 12 と同一 |
| D1 writes | confirmed: member_tags insert + queue update + audit insert / rejected: queue update + audit insert | ±0 | 既存契約と同等 |
| KV ops | 不使用 | ±0 | resolve API は KV を呼ばない |
| R2 ops | 不使用 | ±0 | 同上 |

> 不変条件 #10（無料枠維持）への影響は無視できる範囲。

---

## Secret Hygiene

| 項目 | 状態 | 備考 |
| --- | --- | --- |
| 新規 Cloudflare Secrets 追加 | なし | resolve API は既存 binding のみ使用 |
| 新規 GitHub Secrets 追加 | なし | CI 構成変更なし |
| `.env` 変更 | なし | 1Password 参照に追加項目なし |
| ログへの secret 漏洩 | なし | 新規ログ追加なし（route 実装は変更しない） |

---

## a11y（N/A 理由明示）

- 本タスクは admin API contract の type 整合および contract test 追加のみで UI を変更しない
- visualEvidence: NON_VISUAL（artifacts.json 既定値）
- a11y 観点（キーボード操作 / コントラスト / aria 属性 / スクリーンリーダー）はいずれも本タスクの scope に該当する変更要素を含まない
- 後続 admin UI（tag queue 管理画面）の a11y は別タスクで担保

---

## Shared Package Import 健全性

| 観点 | 確認コマンド | 期待値 |
| --- | --- | --- |
| apps/web → packages/shared | `rg "from '@repo/shared'" apps/web/src` | type / schema 参照のみ。runtime 依存に副作用なし |
| apps/api → packages/shared | `rg "from '@repo/shared'" apps/api/src` | 同上 |
| packages/shared → apps/* | `rg "from '@/'" packages/shared/src` | hit 0（逆方向参照禁止） |
| 循環依存 | dependency-cruiser / madge | 0 件 |

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | coverage 実測値の最終確定 |
| Phase 8 | DRY 化後の構成が Q-5 / Q-6 を pass することを確認 |
| Phase 10 | Q-1〜Q-9 の判定を GO/NO-GO 判定基準表に投入 |
| Phase 11 | typecheck / lint / contract test の green を NON_VISUAL evidence として再利用 |

---

## 多角的チェック観点

- 不変条件 #5: shared package が apps/web から D1 binding を引き込まない（型のみ）
- 不変条件 #10: free-tier 見積もりがすべて ±0
- 不変条件 #11: resolve API の責務拡張がない
- secret hygiene: 1Password 参照に追加項目なし
- CI: `verify-indexes-up-to-date` gate を含む既存 gate を破壊しない

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | typecheck / lint / test 最終 pass | 9 | pending | Q-1〜Q-3 |
| 2 | coverage 最終確定 | 9 | pending | Q-4 |
| 3 | dependency-cruiser / 循環依存確認 | 9 | pending | Q-5 / Q-6 |
| 4 | free-tier 見積もり表記述 | 9 | pending | Q-7 |
| 5 | secret hygiene 確認 | 9 | pending | Q-8 |
| 6 | a11y N/A 理由明示 | 9 | pending | Q-9 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | Quality Gate チェック表 / Free-tier 見積もり / Secret Hygiene / a11y N/A / Import 健全性 |
| メタ | artifacts.json | Phase 9 を completed に更新 |

---

## 完了条件

- [ ] Q-1〜Q-9 の全項目が「達成 / N/A」のいずれかで判定済み
- [ ] Free-tier 見積もりが Workers / D1 / KV / R2 の 4 リソースで ±0 と確認済
- [ ] Secret hygiene 4 項目すべてで「追加なし」確認済
- [ ] a11y N/A 理由が明示されている
- [ ] shared package import 健全性が双方向 + 循環依存 0 件で確認済

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-09/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- いずれかの Q-* が「未達」の場合 Phase 8 / 5 への戻り経路を明記
- artifacts.json の phase 9 を completed に更新

---

## 次 Phase

- 次: 10 (最終レビューゲート)
- 引き継ぎ事項: Q-1〜Q-9 判定 / Free-tier ±0 / Secret 追加 0 / a11y N/A / 循環依存 0
- ブロック条件: Q-1〜Q-3 のいずれかが red の場合は Phase 5 / 8 に戻る
