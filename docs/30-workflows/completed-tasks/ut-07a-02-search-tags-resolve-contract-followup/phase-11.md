# Phase 11: 手動テスト検証（NON_VISUAL 縮約テンプレ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07a-02-search-tags-resolve-contract-followup |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト検証 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 (最終レビューゲート) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| Source Issue | #297 |
| TaskType | implementation |
| VisualEvidence | **NON_VISUAL** |
| 種別判定 | API contract follow-up（admin tag queue resolve）→ NON_VISUAL |

---

## 目的

本 Phase は「resolve API の discriminated union 契約が apps/web client・shared zod schema・08a contract test に正しく伝播していること」を、
`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` の縮約テンプレに従い**画像なしの代替 evidence（contract test PASS / curl 応答転記 / audit_logs サンプル / link checklist）**で確認する。
screenshot 生成は false green 防止のため**禁止**する。

---

## 種別判定（最初に確認）

| 軸 | 判定 | 根拠 |
| --- | --- | --- |
| UI 差分 | なし | apps/web 側は client function 引数型のみ変更。renderer / route 追加なし |
| 実環境前提 | 不要 | 08a contract test を vitest（miniflare D1）で確定的に PASS させる |
| 主証跡 | 自動テスト | `apps/api/test/contract/admin-tags-queue-resolve.test.ts` の vitest 件数 |
| 適用テンプレ | NON_VISUAL 縮約（`phase-template-phase11.md` §「docs-only / NON_VISUAL 縮約テンプレ」） | visualEvidence=NON_VISUAL |

---

## 必須成果物（NON_VISUAL 縮約 3 点 + 任意補助 1 点）

| # | ファイル | 必須 | 役割 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | ✅ | NON_VISUAL 宣言 / 発火条件 / 必須 outputs リンク / 代替 evidence 差分表 |
| 2 | `outputs/phase-11/test-report.md` | ✅ | 08a contract test PASS evidence。実行コマンド・vitest 件数・curl 出力 placeholder・wrangler dev log placeholder |
| 3 | `outputs/phase-11/manual-evidence.md` | ✅ | NON_VISUAL 代替 evidence（confirmed / rejected / idempotent / 4xx の応答転記、audit_logs 行サンプル） |
| 4 | `outputs/phase-11/link-checklist.md` | 任意補助 | apps/web client 呼び出し全箇所と shared zod schema export の link 一覧 |

> Screenshot は生成しない。`screenshots/.gitkeep` も置かない。VISUAL 系 outputs（`screenshot-plan.json` / `manual-test-checklist.md` / `discovered-issues.md` / `phase11-capture-metadata.json`）は本 Phase の対象外。

---

## 実行タスク

1. 08a contract test を vitest で実行し、PASS 件数を `test-report.md` に記録する
2. miniflare D1 fixture で confirmed / rejected / 同一 payload 再投入（idempotent: true）/ 400 / 409 / 422 の 6 ケースを取得し `manual-evidence.md` に転記する
3. `audit_logs` テーブルから `admin.tag.queue_resolved` / `admin.tag.queue_rejected` の行サンプルを取得し転記する
4. apps/web の `resolveTagQueue` 呼び出し箇所 + shared zod schema export 経路を `link-checklist.md` に列挙する
5. NON_VISUAL であることの宣言 / 代替 evidence 差分表 / 申し送り先（UT-07A-03 staging smoke）を `main.md` に記述する

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` §「NON_VISUAL 縮約テンプレ」 | 必須 3 点フォーマット |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | L1-L4 evidence / 代替 evidence 差分表 |
| 必須 | `outputs/phase-04/main.md` | 08a contract test ケース表 |
| 必須 | `outputs/phase-09/main.md` | typecheck / lint / contract test green 証跡（前提） |
| 参考 | `docs/00-getting-started-manual/specs/12-search-tags.md` | 正本契約（discriminated union） |

---

## 実行手順

### ステップ 1: 環境前提確認

- `pnpm install --frozen-lockfile` exit 0
- 08a contract test ファイル（`apps/api/test/contract/admin-tags-queue-resolve.test.ts` 想定）が存在
- shared zod schema（`packages/shared/src/schemas/admin/tag-queue-resolve.ts`）が export されている

### ステップ 2: contract test 実行と vitest 件数取得

```bash
mise exec -- pnpm --filter @repo/api test:run \
  apps/api/test/contract/admin-tags-queue-resolve.test.ts
```

期待: 6 ケース全 PASS（confirmed / rejected / idempotent / validation-400 / conflict-409 / unknown-tag-422）。
件数を `test-report.md` に「N/N PASS」形式で記録する。

### ステップ 3: API 応答転記（NON_VISUAL 代替）

各ケースについて、test 内の actual response（status / body）を `manual-evidence.md` に以下フォーマットで転記する。

```markdown
### Case 1: confirmed (200 / idempotent:false)

- request: POST /admin/tags/queue/:queueId/resolve
- body: `{ "action": "confirmed", "tagCodes": ["JOB_DEV", "AREA_KOBE"] }`
- expect status: 200
- expect body shape: `{ ok: true, result: { idempotent: false, queueId: "...", status: "resolved", tagCodes: [...] } }`
- vitest assertion file:line: `admin-tags-queue-resolve.test.ts:LXX`
- audit_logs 行サンプル: `action=admin.tag.queue_resolved actor_id=... target_member_id=... ...`
```

curl 出力 / wrangler dev log は **placeholder**（実走は UT-07A-03 staging smoke で実施）として明記する。

### ステップ 4: link-checklist 作成（任意補助）

```bash
rg -n "resolveTagQueue" apps/web/src
rg -n "tagQueueResolveBodySchema" apps/api packages/shared
```

結果を `link-checklist.md` に「参照元 → 参照先 / 状態（OK / Broken）」テーブルで記録する。

### ステップ 5: main.md 集約

- visualEvidence=NON_VISUAL 宣言
- 必須 3 点へのリンク
- 代替 evidence 差分表（下記）
- 申し送り先: UT-07A-03 staging smoke / production cutover

---

## 代替 evidence 差分表（必須）

| 元前提のシナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 wrangler dev で実 D1 接続 | wrangler dev + curl | miniflare D1 + vitest contract test | repository 契約・SQL・unique 制約 | UT-07A-03 staging smoke |
| S-2 admin auth 経由で resolve 投入 | 実 admin user + Auth.js | adminUsers fixture + bearer test header | 認可ガードの真偽 | UT-07A-03 staging smoke |
| S-3 confirmed 200 / idempotent:false | curl POST | vitest case 1 + body assertion | discriminated union confirmed 分岐 | （L3 で吸収済） |
| S-4 confirmed 200 / idempotent:true（同一 payload 再投入） | curl × 2 | vitest case 3 + idempotent flag assertion | 冪等計算プロパティ | （L3 で吸収済） |
| S-5 rejected 200 | curl POST | vitest case 2 + reject_reason 保存確認 | rejected 分岐 + audit | （L3 で吸収済） |
| S-6 validation 400 / conflict 409 / unknown tag 422 | curl POST 異常系 | vitest case 4-6 + status assertion | zod schema rejection / queue race / unknown code | （L3 で吸収済） |
| S-7 「赤がちゃんと赤になる」（L4 intentional violation） | — | discriminated union を意図的に外した body で 400 が返ることを 1 ケース追加 | schema rejection が機能している | （L4 で吸収済） |

---

## インタラクション状態テーブル（API 応答軸）

| 状態 | request body | expected status | expected body shape | テスト ID |
| --- | --- | --- | --- | --- |
| 200 idempotent:false | `{ action: "confirmed", tagCodes: [...] }` 初回 | 200 | `{ ok: true, result: { idempotent: false, queueId, status: "resolved", tagCodes } }` | TC-01 |
| 200 idempotent:false (rejected) | `{ action: "rejected", reason: "..." }` 初回 | 200 | `{ ok: true, result: { idempotent: false, queueId, status: "rejected", reason } }` | TC-02 |
| 200 idempotent:true | 直前と完全同一 payload 再投入 | 200 | `{ idempotent: true, ... }` | TC-03 |
| 400 validation_error | `{ action: "confirmed", tagCodes: [] }` / action 欠落 / reason 空 | 400 | `{ error: "validation_error", details: [...] }` | TC-04 |
| 409 conflict | 別 payload で逆走 / 別 admin が先行 resolve 済み | 409 | `{ error: "conflict" }` | TC-05 |
| 422 unknown_tag_code | `tagCodes` に未知 code | 422 | `{ error: "unknown_tag_code", unknown: [...] }` | TC-06 |

---

## N/A 理由テーブル

| 検証種別 | 状態 | N/A 理由 |
| --- | --- | --- |
| Screenshot（VISUAL） | 撮影なし | API contract follow-up のため UI 差分なし。visualEvidence=NON_VISUAL |
| Playwright UI E2E | 実行なし | renderer route 変更なし。client 関数引数型変更のみ |
| アクセシビリティ（WCAG） | 検証なし | UI 差分なし |
| ダーク/ライトモード比較 | 撮影なし | UI 差分なし |
| ホバー / フォーカス | 撮影なし | UI 差分なし |
| Cloudflare Workers 実 deploy 検証 | 実走なし | UT-07A-03 staging smoke へ申し送り |

---

## 統合テスト連携

| 連携先 | 連携内容 |
| --- | --- |
| Phase 9 | 09 で確認した typecheck / lint / contract test green を本 Phase の前提として再利用 |
| Phase 12 | `manual-evidence.md` の不変条件 #11 #5 観点記録を `implementation-guide.md` Part 2 へ反映 |
| UT-07A-03 | 本 Phase で「保証できない範囲」とした curl / wrangler dev / 実 D1 / 実 admin auth を引き渡す |

---

## 多角的チェック観点

- 不変条件 #11（admin は本人本文を直接編集できない）: contract test の confirmed / rejected いずれも `member_tags` 経由の付与・拒否のみで member 本文に touch しない assertion を含む
- 不変条件 #5（apps/web → D1 直接禁止）: link-checklist で apps/web 側の D1 binding 参照 0 件を確認
- L4（意図的 violation → red 確認）: discriminated union を外した payload で 400 が返ることを 1 ケース必ず確認
- 機密情報 grep: evidence ファイルに admin email / token / actor_id 平文を転記しない（hash / id だけ）

---

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | contract test 実行 + 件数記録 | pending | TC-01〜TC-06 PASS を期待 |
| 2 | confirmed / rejected / idempotent 応答転記 | pending | TC-01〜TC-03 |
| 3 | 4xx 応答転記（400 / 409 / 422） | pending | TC-04〜TC-06 |
| 4 | audit_logs 行サンプル取得 | pending | resolved / rejected 各 1 行 |
| 5 | link-checklist 作成 | pending | 任意補助 |
| 6 | 代替 evidence 差分表 | pending | 申し送り先 = UT-07A-03 |
| 7 | main.md 集約 | pending | NON_VISUAL 宣言含む |

---

## 成果物

| 種別 | パス | 必須 | 説明 |
| --- | --- | --- | --- |
| ドキュメント | `outputs/phase-11/main.md` | ✅ | NON_VISUAL 宣言 / 必須 3 点リンク / 代替 evidence 差分表 |
| ドキュメント | `outputs/phase-11/test-report.md` | ✅ | contract test PASS evidence + 件数 |
| ドキュメント | `outputs/phase-11/manual-evidence.md` | ✅ | API 応答転記 + audit_logs サンプル |
| ドキュメント | `outputs/phase-11/link-checklist.md` | 任意 | client 呼び出し / shared schema export 一覧 |

---

## 完了条件

- [ ] `outputs/phase-11/main.md` に visualEvidence=NON_VISUAL を明記
- [ ] `outputs/phase-11/test-report.md` に vitest 件数（N/N PASS）と実行コマンドを記録
- [ ] `outputs/phase-11/manual-evidence.md` に TC-01〜TC-06 の応答 + audit_logs 行サンプルを転記
- [ ] 代替 evidence 差分表が S-1〜S-7 を網羅
- [ ] L4 intentional violation（schema rejection の red 確認）を 1 件以上実施
- [ ] N/A 理由テーブルが 6 行以上（screenshot / Playwright / a11y / theme / hover / 実 deploy）
- [ ] curl / wrangler dev / 実 staging deploy は placeholder のみで、実走は UT-07A-03 へ申し送り済み
- [ ] artifacts.json の phase 11 を completed に更新

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 必須 3 点（main / test-report / manual-evidence）が `outputs/phase-11/` 直下に配置済み
- screenshot 系ファイルが 0 件（生成禁止の遵守確認）
- 完了条件 8 件すべてにチェック
- artifacts.json の phase 11 を completed に更新

---

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: TC-01〜TC-06 の応答 / audit_logs サンプル / 代替 evidence 差分表 / 申し送り先（UT-07A-03）
- ブロック条件: contract test に FAIL がある場合は Phase 12 に進まず Phase 5/6 へ戻る
