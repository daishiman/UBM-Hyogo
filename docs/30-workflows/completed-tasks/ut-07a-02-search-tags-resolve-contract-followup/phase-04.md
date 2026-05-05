# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビューゲート) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |
| Source Issue | #297 |

---

## 目的

Phase 3 で採用した「案 A: shared zod schema」を前提に、
resolve API 契約を unit / contract / authorization の 3 軸で検証する verify suite を設計する。
Phase 2 の discriminated union バリデーションフローの全分岐を、08a contract test ケースに 1:1 対応させ、
AC-1〜AC-7（Phase 1 で列挙）を Phase 7 マトリクスへ橋渡しできる粒度まで分解する。
Playwright / staging UI smoke は UT-07A-03 に委譲し、本タスクの Phase 11 evidence には含めない。

---

## 実行タスク

1. verify suite の 3 軸（unit / contract / authorization）でテストケース表を作成する
2. 08a contract test の canonical 6 ケース（confirmed / rejected / idempotent / 400 validation / 409 conflict / 422 unknown tagCode）を明文化する
3. テスト fixture（D1 seed）を `tag_assignment_queue` / `member_tags` / `tag_definitions` / `audit_logs` の 4 表で設計する
4. 既存 07a contract test との重複検出表を作成し、本タスクで「新規追加」「上書き拡張」「重複のため skip」を分類する
5. AC マトリクスの基礎（AC-id ↔ test-id の対応）を Phase 7 へ引き継ぐ形で叩き台にする

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | resolve body shape の正本 |
| 必須 | phase-02.md | バリデーションフロー Mermaid / dependency matrix |
| 必須 | phase-03.md | 採用案 A（shared zod schema） |
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/implementation-guide.md | 上流契約 |
| 参考 | apps/api/test/contract/ | 既存 contract test の配置慣習（Phase 4 冒頭で確定: ブロッカー B-3） |
| 参考 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | body shape 記述 |

---

## verify suite 設計（4 軸）

### 軸 1: Unit テスト（zod schema validation）

| ID | 入力 | 期待 | 検証手段 |
| --- | --- | --- | --- |
| U-01 | `{ action: "confirmed", tagCodes: ["CODE_A","CODE_B"] }` | parse success / type narrow → confirmed branch | `tagQueueResolveBodySchema.safeParse` |
| U-02 | `{ action: "rejected", reason: "duplicate" }` | parse success / type narrow → rejected branch | 同上 |
| U-03 | `{ action: "confirmed", tagCodes: [] }` | parse failure（空配列拒否） | `safeParse` の `success: false` |
| U-04 | `{ action: "rejected", reason: "" }` | parse failure（空文字拒否） | 同上 |
| U-05 | `{ action: "rejected" }`（reason 欠落） | parse failure | 同上 |
| U-06 | `{ action: "confirmed" }`（tagCodes 欠落） | parse failure | 同上 |
| U-07 | `{ tagCodes: ["X"] }`（discriminator 欠落） | parse failure | 同上 |
| U-08 | `{ action: "unknown", ... }` | parse failure（discriminator 不正） | 同上 |
| U-09 | `null` / `undefined` / 非オブジェクト | parse failure | 同上 |

> 配置: `packages/shared/src/schemas/admin/__tests__/tag-queue-resolve.test.ts` （Vitest）

### 軸 2: Contract テスト（08a Vitest contract suite）

| ID | シナリオ | リクエスト body | 期待ステータス | 期待レスポンス key | 期待 D1 副作用 |
| --- | --- | --- | --- | --- | --- |
| C-01 | confirmed 初回 | `{ action:"confirmed", tagCodes:["TC_A"] }` | 200 | `idempotent: false` / `status: "resolved"` | `tag_assignment_queue.status='resolved'` / `member_tags` 1 行追加 / `audit_logs.action='admin.tag.queue_resolved'` |
| C-02 | rejected 初回 | `{ action:"rejected", reason:"duplicate" }` | 200 | `idempotent: false` / `status: "rejected"` | `tag_assignment_queue.status='rejected'` / `reject_reason` 保存 / `audit_logs.action='admin.tag.queue_rejected'` |
| C-03 | confirmed 同 payload 再投入 | C-01 と同一 body | 200 | `idempotent: true` | 副作用なし（audit_logs 追加なし） |
| C-04 | rejected 同 payload 再投入 | C-02 と同一 body | 200 | `idempotent: true` | 副作用なし |
| C-05 | confirmed → rejected 逆走（race） | C-01 後に C-02 body を投入 | 409 | `error: "conflict"` | 状態不変 |
| C-06 | unknown tagCode | `{ action:"confirmed", tagCodes:["NOT_EXIST"] }` | 422 | `error: "unknown_tag_code"` | 状態不変 |
| C-07 | rejected reason 欠落 | `{ action:"rejected" }` | 400 | `error: "validation_error"` | 状態不変 |
| C-08 | discriminator 欠落 | `{ tagCodes:["TC_A"] }` | 400 | `error: "validation_error"` | 状態不変 |
| C-09 | confirmed tagCodes 空配列 | `{ action:"confirmed", tagCodes:[] }` | 400 | `error: "validation_error"` | 状態不変 |
| C-10 | queue.status が member_deleted 由来で confirmed 不可 | unknown member queue | 422 | `error: "member_deleted"` | 状態不変 |

> 配置: `apps/api/test/contract/admin-tags-queue-resolve.test.ts`（既存ファイルが無ければ新設、Phase 5 で確定）
> Canonical contract gate は TC-01〜TC-06（confirmed / rejected / idempotent / 400 / 409 / 422）の 6 ケース。C-01〜C-10 は設計時の詳細分岐であり、実走 evidence では TC-01〜TC-06 に集約する。

### 軸 3: E2E テスト（本タスクでは実走しない / UT-07A-03 へ委譲）

| ID | シナリオ | UI 操作 | 期待 |
| --- | --- | --- | --- |
| E-01 | admin が confirmed flow を完走 | queue list → 行選択 → 確定 modal → tagCode 選択 → submit | toast「確定しました」/ 行が resolved 状態に更新 |
| E-02 | admin が rejected flow を完走 | queue list → 行選択 → 拒否 modal → reason 入力 → submit | toast「拒否しました」/ 行が rejected 状態に更新 |
| E-03 | reason 未入力で rejected submit | 拒否 modal で reason を空のまま submit | client 側 zod で阻止 / API 呼び出されない |

> E2E は UI / staging smoke の責務であり、本タスクの NON_VISUAL evidence には含めない。UT-07A-03 に委譲する。
| E-04 | 同 payload 再 submit（idempotent） | E-01 直後に同行の同一操作 | toast「すでに確定済みです」/ 状態は維持 |

> 配置: `apps/web/e2e/admin/tag-queue-resolve.spec.ts` は UT-07A-03 で扱う。本タスクでは spec 追加も実走も行わない。
> 本 Phase ではケース表のみ確定し、実装は Phase 5 placeholder + Phase 11 実走に分離。

### 軸 4: Authorization テスト（admin gate）

| ID | シナリオ | 認証状態 | 期待 |
| --- | --- | --- | --- |
| A-01 | 未認証で resolve POST | `Authorization` ヘッダなし | 401 / audit_logs 追加なし |
| A-02 | 一般会員 session で resolve POST | 非 admin の session | 403 / audit_logs 追加なし |
| A-03 | admin session で resolve POST | admin session | 200（C-01 と同等） |

> 配置: `apps/api/test/contract/admin-tags-queue-resolve-auth.test.ts`（Auth gate を独立 file に切り出し）

---

## テストデータ fixture 設計

### `tag_definitions` seed

| id | code | label | active |
| --- | --- | --- | --- |
| 1 | TC_A | 要件定義 | true |
| 2 | TC_B | 設計 | true |
| 3 | TC_DEPRECATED | 旧タグ | false |

### `tag_assignment_queue` seed

| id | member_id | requested_tag_code | status | reject_reason | created_at |
| --- | --- | --- | --- | --- | --- |
| Q1 | M1 | TC_A | pending | null | 2026-04-01 |
| Q2 | M2 | TC_B | pending | null | 2026-04-02 |
| Q3 | M_DELETED | TC_A | pending | null | 2026-04-03 |
| Q4 | M3 | TC_A | resolved | null | 2026-04-04（C-05 の race 用に事前 resolved）|

### `member_tags` 期待状態

- C-01 後: `(member_id=M1, tag_id=1)` が 1 行追加される
- C-03 後: 行数不変（idempotent）

### `audit_logs` 期待状態

| シナリオ | action | actor | target | extra |
| --- | --- | --- | --- | --- |
| C-01 | admin.tag.queue_resolved | admin session id | queue_id=Q1 | `tagCodes` を JSON 保存 |
| C-02 | admin.tag.queue_rejected | admin session id | queue_id=Q2 | `reason` を JSON 保存 |
| C-03 / C-04 | （追加なし） | — | — | — |

---

## 既存 07a contract test との重複検出

| 既存テスト（推定） | 本タスクでの扱い | 根拠 |
| --- | --- | --- |
| 07a 由来の confirmed 200 ケース | **上書き拡張**（response key に `idempotent` を追加） | Phase 1 で空 body 旧契約の名残あり |
| 07a 由来の rejected 200 ケース | **上書き拡張**（reason validation 強化） | 同上 |
| 07a 由来の validation 400 ケース | **重複のため skip**（C-07〜C-09 で網羅） | drift inventory より |
| idempotent ケース | **新規追加**（C-03 / C-04） | 07a に未収載 |
| 409 race | **新規追加**（C-05） | 07a に未収載 |
| 422 unknown_tag_code | **新規追加**（C-06） | 07a に未収載 |
| 422 member_deleted | **新規追加**（C-10） | 07a に未収載 |
| auth gate（A-01〜A-03）| **新規追加** | 07a で薄め |

> 重複検出は Phase 5 冒頭の `rg "admin-tags-queue-resolve"` で最終確認する。

---

## AC マトリクス（基礎・Phase 7 で完成）

| AC | 内容 | 紐付くテスト ID |
| --- | --- | --- |
| AC-1 | resolveTagQueue の TS 型が discriminated union | U-01 / U-02 / typecheck（Phase 9）|
| AC-2 | confirmed 成功ケースが contract test に存在 | C-01 |
| AC-3 | rejected 成功ケースが contract test に存在 | C-02 |
| AC-4 | validation error ケースが存在 | C-07 / C-08 / C-09 / U-03〜U-09 |
| AC-5 | idempotent ケースが存在（200 + idempotent:true）| C-03 / C-04 |
| AC-6 | spec ↔ implementation-guide が文字列一致 | Phase 12 grep（test 外）|
| AC-7 | 旧契約（空 body）残存ゼロ | Phase 12 grep（test 外）|
| AC-8（追加）| 409 race / 422 unknown / auth gate を追加検証 | C-05 / C-06 / C-10 / A-01〜A-03 |

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 軸 1〜4 のテストファイル新設 / 拡張を実装ランブックに展開 |
| Phase 6 | 異常系 fixture（C-05 / C-06 / C-07〜C-09 / C-10 / A-01 / A-02）を別表で再深堀 |
| Phase 7 | 本 Phase の AC マトリクス基礎を完成版に昇格 |
| Phase 9 | typecheck / lint / vitest contract green 証跡を取得 |
| Phase 11 | 軸 3 の E-01〜E-04 を実走 |

---

## 多角的チェック観点（不変条件）

- 不変条件 #11（admin は本人本文を直接編集できない）: C-01 / C-02 で `member_tags` / `tag_assignment_queue.reject_reason` のみ更新され、`members` 本文や consent 系列が一切変更されないことを D1 副作用検証に明記する（**主検証**）
- 不変条件 #5（apps/web → D1 直接禁止）: 軸 4 の auth テストは API 経由のみ。client が D1 binding を持たないことを Phase 9 の lint で確認（**副検証**）
- 不変条件 #2（consent キー統一）: 本タスクで consent 列に触れないことを fixture で明示（影響なし宣言）
- 不変条件 #10（無料枠制約）: contract test の D1 seed 量を 5 行未満に抑える（CI 時間増を抑止）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit テスト U-01〜U-09 ケース表確定 | 4 | pending | shared schema 単体検証 |
| 2 | contract テスト C-01〜C-10 ケース表確定 | 4 | pending | Phase 2 Mermaid 全分岐対応 |
| 3 | E2E テスト E-01〜E-04 委譲先確定 | 4 | pending | UT-07A-03 で実走 |
| 4 | auth テスト A-01〜A-03 ケース表確定 | 4 | pending | 401 / 403 / 200 |
| 5 | D1 fixture 設計（4 テーブル）| 4 | pending | seed 量 5 行未満 |
| 6 | 既存 07a contract test 重複検出 | 4 | pending | 新規 / 上書き / skip |
| 7 | AC マトリクス基礎を Phase 7 へ引き継ぎ | 4 | pending | AC-id ↔ test-id 表 |
| 8 | ブロッカー B-3（contract test 配置慣習）解消 | 4 | pending | apps/api/test/contract/ で確定 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | verify suite 4 軸ケース表 / fixture 設計 / 重複検出表 / AC マトリクス基礎 |
| メタ | artifacts.json | Phase 4 を completed に更新 |

---

## 完了条件

- [ ] unit テスト U-01〜U-09 が全件記述済み
- [ ] canonical contract test TC-01〜TC-06 が全件記述済み（confirmed / rejected / idempotent / 409 / 422 / 400 を網羅）
- [ ] E2E テスト E-01〜E-04 が全件記述済み（UT-07A-03 へ委譲済みとして明記）
- [ ] authorization テスト A-01〜A-03 が全件記述済み（401 / 403 / 200）
- [ ] fixture が 4 テーブル分（tag_definitions / tag_assignment_queue / member_tags / audit_logs）設計済み
- [ ] 既存 07a contract test との重複検出表が「新規 / 上書き / skip」3 分類で完成
- [ ] AC マトリクス基礎（AC-1〜AC-8 ↔ test-id）が Phase 7 へ引き継げる粒度で完成
- [ ] ブロッカー B-3（contract test 物理配置）が `apps/api/test/contract/` で確定

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-04/main.md` が指定パスに配置済み
- 完了条件 8 件すべてにチェック
- 不変条件 #11 主検証 / #5 副検証の test 紐付けが明示済み
- artifacts.json の phase 4 を completed に更新

---

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: verify suite 4 軸ケース表 / fixture 設計 / 重複検出表 / AC マトリクス基礎 / contract test 配置慣習（B-3 解消結果）
- ブロック条件: contract test C-01〜C-10 のいずれかが未確定、または fixture 4 テーブル未網羅の場合は Phase 5 に進まない
