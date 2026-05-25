# Phase 6: テスト追加（fail path カバレッジ点検 + 追補判断）

**[実装区分: 実装仕様書（verify_existing）]**

> Phase 3 §1 の再解釈方針に従い、本 Phase は実装タスクの「fail path 拡充」を **「既存テストの fail path カバレッジ点検 + 追補判断」** に置き換える。既存 `*.spec.*` が fail path を網羅しているかを点検し、穴があれば Phase 3 §7 方針に沿って追補 or 意思決定する。

## 1. fail path 点検表（既存テストの網羅状況）

| # | fail path | 期待挙動 | 既存カバー | テスト | 点検結果 |
|---|-----------|---------|-----------|--------|---------|
| F1 | 不正 email（`actorEmail`） | `ListAuditQueryZ` の `.email()` で 400 | あり | T3（query validation） | 網羅済 |
| F2 | limit 範囲外（<1 / >100） | `ListAuditQueryZ` の `1..100` 制約で 400 | あり | T3（query validation） | 網羅済 |
| F3 | 不正 cursor（base64url/JSON 不正） | `decodeAuditCursor`→null → route 400 | あり | T3（cursor decode）| 網羅済 |
| F4 | 不正 date range（パース不能 from/to） | `jstInputToUtcIso` 失敗 → 400 | あり | T3（date range） | 網羅済 |
| F5 | from>=to（end-exclusive 違反） | 400 | あり | T3（date range from>=to） | 網羅済 |
| F6 | parseError（before/after が JSON parse 失敗） | item の `parseError` true → UI で警告表示 | あり | T3（masking）, T1（render: parseError 警告） | 網羅済 |
| F7 | JSON parse 失敗時の masking フォールバック | `parseAndMask` が parse 失敗を握り raw を出さない | あり | T3（parseAndMask） | 網羅済 |
| F8 | masking エッジ（null/undefined/primitive/配列再帰/多段nest/非文字列PII key） | 再帰的にマスク・型強制 String化 | あり | T1（masking 各ケース） | 網羅済 |
| F9 | nextCursor=null（次ページなし） | 「次のページはありません」表示・次リンク不生成 | あり | T1（render 分岐） | 網羅済 |
| F10 | actorEmail 欠落（null/undefined/空） | `maskAuditText` が "system" を返す | あり | T1（maskAuditText） | 網羅済 |
| F11 | summarize エッジ（null/配列/空obj/4超キー/primitive） | "なし"/"N items"/"empty object"/"+N"/typeof | あり | T1（summarizeAuditJson） | 網羅済 |
| F12 | formatJst エッジ（不正文字列/空文字） | 不正文字列はそのまま / 空文字はそのまま | あり | T1（formatJst） | 網羅済 |

## 2. 点検判定

- fail path F1〜F12 はすべて既存テスト（T1: 423 行 / T3: 303 行）で**網羅済**。空白セルは **0 件**。
- したがって本 Phase での **新規テスト追補は不要**。これは Phase 3 §2「PII masking / cursor 契約 PASS」「現状は網羅されている前提」と整合する。
- 点検は「既存テストの観点（テスト名・describe ブロック）が上記 fail path を被覆しているか」のレビューであり、新規テストファイル作成・既存テスト改変は行わない（verify_existing / 不変条件8 `*.spec.*` のみ）。

## 3. 追補判断（意思決定）

| 観点 | 判定 | 根拠 |
|------|------|------|
| API fail path（F1〜F5, F7） | 追補不要 | T3 で 400 分岐・cursor・date range を網羅 |
| UI fail path（F6, F8〜F12） | 追補不要 | T1 で masking/render/summarize/format の各エッジを網羅 |
| 二段 masking 漏れ経路 | 追補不要 | API 側（F7）+ UI 側（F8）の双方をそれぞれの層のテストが担保 |

> 結論: **fail path カバレッジに穴なし → 追補テストゼロ**。仮に Phase 9 coverage map で partial が検出された場合のみ、当該 FR に対応する `*.spec.*` ケースをこの Phase に追補する（現時点では発生しない見込み）。

## 4. 点検の再現手順

fail path が現コードで実際に弾かれることは、Phase 4 の targeted regression run（T3 / T1）の PASS により再確認する。本 Phase 固有の追加実行コマンドはない（新規テストを書かないため）。

```bash
# fail path を含む既存テストの再実行（Phase 4 STEP 1/2 と同一）
mise exec -- pnpm --filter @ubm-hyogo/api test -- src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
```

## 5. 完了条件（Phase 6 DoD）

- [ ] fail path 点検表（§1、F1〜F12）を作成し、各セルの網羅状況を判定した。
- [ ] 空白セル（未カバー fail path）が 0 件であることを §2 で明記した。
- [ ] 追補判断（§3）を「追補不要・新規テストゼロ」として意思決定し根拠を記録した。
- [ ] 新規テストファイルを作成していない（verify_existing 方針を維持した）。
- [ ] 点検再現手順（§4）が Phase 4 の targeted run と整合している。
