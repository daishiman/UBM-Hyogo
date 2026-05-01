# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |
| Source Issue | #297 |

---

## 目的

Phase 5 で実装した shared zod schema / apps/web client / 08a contract test を対象に、
命名 / 型 / path / endpoint の 4 軸で Before/After 比較を行い、apps/api と apps/web の重複を解消し、
client API 呼び出し時に IDE が discriminated union を補完できる状態へ収束させる。
本 Phase はテスト破壊を伴わない安全な再構成のみを対象とする。

---

## 実行タスク

1. Before / After 比較表（命名 / 型 / path / endpoint）を作成
2. apps/api と apps/web の重複定義（zod / type / 定数）を一覧化し、shared schema への集約状況を点検
3. discriminated union 型を `z.infer` 経由で export する形が apps/web で IDE 補完されるか確認
4. Phase 7 の未カバー U-1（422）/ U-2（409）の fixture を共通 helper に集約
5. テストの命名統一（`returns 200 on confirmed` 系）と describe ブロックの再構成
6. 認知負荷削減ポイント（client API 呼び出し時の補完 / type narrowing 動作）を箇条書きで記録

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | Module 設計 / 追従対象表 |
| 必須 | phase-03.md | 採用案 A（shared zod schema） |
| 必須 | phase-07.md | AC マトリクス / 未カバー領域 |
| 必須 | outputs/phase-05/ | 実装後のファイル一覧 |
| 必須 | outputs/phase-06/ | 異常系 fixture |
| 参考 | packages/shared/ | 既存 shared schema 配置慣習 |

---

## Before / After 比較表

### 命名

| 対象 | Before | After | 根拠 |
| --- | --- | --- | --- |
| body type 名 | `ResolveTagQueueBody` / `TagQueueResolveInput` 等の混在 | `TagQueueResolveBody`（単数形・名詞順は仕様語準拠） | Phase 2 alias 表 |
| zod schema 変数 | `resolveBodySchema` / `bodySchema` の混在 | `tagQueueResolveBodySchema` | Phase 2 Module 設計 |
| audit action | `tag.queue.resolved` / `admin.tag.resolved` の混在 | `admin.tag.queue_resolved` / `admin.tag.queue_rejected` | Phase 2 alias 表 |
| contract test describe | `resolveTagQueue` 単独 | `POST /admin/tags/queue/:queueId/resolve` （endpoint パス基準） | API ルートとの対応性 |

### 型

| 対象 | Before | After | 根拠 |
| --- | --- | --- | --- |
| body 型表現 | union of object literal を手書き | `z.discriminatedUnion('action', [...])` で zod 定義 → `z.infer` で型導出 | 採用案 A |
| export 形 | `export type TagQueueResolveBody = ...` を apps/web に手書き複製 | `packages/shared` から `TagQueueResolveBody` / `tagQueueResolveBodySchema` を re-export | 重複削減 |
| narrowing | 呼び出し側で `if (body.action === ...)` の手書き narrowing | discriminated union により TypeScript が自動 narrowing | IDE 補完強化 |

### Path

| 対象 | Before（候補） | After（採用） | 根拠 |
| --- | --- | --- | --- |
| shared schema 物理位置 | `packages/shared/src/admin/tag-queue.ts` | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` | Phase 2 Module 設計 / `schemas/admin/` 配下に集約 |
| apps/web client | `apps/web/src/lib/api/admin.ts` （現状） | 同左（path 変更なし、import 元のみ shared に切替）| 移動コスト最小化 |
| apps/api route | `apps/api/src/routes/admin/tags/queue/resolve.ts` | 同左（path 変更なし、parser を shared schema 経由に切替）| 同上 |
| contract test | `apps/api/test/contract/admin-tags-queue-resolve.test.ts` | 同左（path 変更なし、fixture を shared schema 経由で生成）| 同上 |

### Endpoint

| 対象 | Before | After | 根拠 |
| --- | --- | --- | --- |
| HTTP method / path | `POST /admin/tags/queue/:queueId/resolve` | 変更なし | Phase 1 scope（契約のみ拡張） |
| status code | 200 / 400 / 409 / 422 | 変更なし | 既存契約維持 |
| response shape | `{ ..., idempotent?: boolean }` | 変更なし | 既存契約維持 |

> endpoint 自体は変更しない。zod schema 経由で「契約の表現」のみ DRY 化する。

---

## 重複削減対象一覧

| # | 重複箇所 | 集約先 | 確認方法 |
| --- | --- | --- | --- |
| D-1 | `TagQueueResolveBody` 型を apps/api と apps/web で別定義 | `packages/shared` 1 箇所 | `rg "type TagQueueResolveBody"` で hit 1 件 |
| D-2 | discriminated union の zod schema | 同上 | `rg "discriminatedUnion\('action'" packages/ apps/` で hit 1 件 |
| D-3 | contract test の fixture（confirmed / rejected の payload リテラル） | `apps/api/test/contract/_fixtures/tag-queue-resolve.ts`（新設 or 既存）| 同 fixture を 4 ケース全てが import |
| D-4 | audit action 文字列定数 | `packages/shared/src/audit/actions.ts`（既存 or 新設）| `rg "admin.tag.queue_resolved"` で 定数定義 1 件 |

---

## 認知負荷削減ポイント

- apps/web で `import { resolveTagQueue } from '@/lib/api/admin'` した直後、`resolveTagQueue(queueId, { action: '` まで打つと IDE が `'confirmed' | 'rejected'` を補完する
- `action: 'confirmed'` を選んだ瞬間に `tagCodes: string[]` が必須補完される（discriminated union の narrowing）
- `action: 'rejected'` を選んだ瞬間に `reason: string` が必須補完される
- 旧契約（空 body）の呼び出しは TypeScript エラーとして compile time に検出される

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 未カバー U-1 / U-2 を本 Phase で fixture 集約済として解消 |
| Phase 9 | DRY 化後の typecheck / lint / contract test green を最終確認 |
| Phase 10 | DRY 化が破壊的変更を生んでいないことを GO 条件として確認 |
| Phase 12 | shared schema の export パスを api-endpoints.md に追記 |

---

## 多角的チェック観点

- 不変条件 #5: shared schema が D1 binding に依存していないこと（pure zod のみ）
- 不変条件 #11: 集約後も resolve API の責務範囲が変わっていないこと
- DRY: D-1〜D-4 の hit 数がそれぞれ 1 件に収まっている
- YAGNI: 本 Phase で 07a 本体や 06c 系のリファクタには手を出さない（scope 外）
- 後方互換: shared schema 経由に切り替えても既存 contract test が green を維持する

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before/After 比較表（命名 / 型 / path / endpoint） | 8 | pending | 4 軸 |
| 2 | 重複削減対象 D-1〜D-4 の集約状況点検 | 8 | pending | rg ベースで hit 数確認 |
| 3 | discriminated union の IDE 補完動作確認 | 8 | pending | apps/web 側で手動確認 |
| 4 | fixture の共通化（U-1 / U-2） | 8 | pending | `_fixtures/` に集約 |
| 5 | テスト命名・describe ブロックの再構成 | 8 | pending | endpoint パス基準 |
| 6 | 認知負荷削減ポイント記録 | 8 | pending | 4 項目以上 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After 比較表 / 重複削減一覧 / 認知負荷削減ポイント |
| メタ | artifacts.json | Phase 8 を completed に更新 |

---

## 完了条件

- [ ] Before / After 比較表が 命名 / 型 / path / endpoint の 4 軸で記述されている
- [ ] 重複削減対象 D-1〜D-4 がそれぞれ集約先 1 箇所に収束している
- [ ] discriminated union の IDE 補完が apps/web で動作することを確認済
- [ ] U-1 / U-2 fixture が共通 helper に集約済
- [ ] 認知負荷削減ポイントが 4 項目以上記録されている

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-08/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- DRY 化により既存 contract test が green を維持していることを確認
- artifacts.json の phase 8 を completed に更新

---

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: DRY 化後の構成（shared schema 1 箇所 / fixture 集約） / 認知負荷削減 evidence
- ブロック条件: D-1〜D-4 のいずれかが hit 2 件以上残る場合は本 Phase で再集約
