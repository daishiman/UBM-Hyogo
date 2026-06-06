# Phase 11: 手動テスト（3 層評価計画）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | VISUAL_ON_EXECUTION |
| 評価対象 UI | `/admin/audit`（batchId filter input / audit row batchId 表示 + copy ボタン） |
| screenshot 状態 | **pending_user_gate（authenticated runtime visual）** |

> Local implementation and focused tests are complete. Authenticated runtime screenshot capture remains user-gated.

---

## 1. VISUAL_ON_EXECUTION の扱い

本タスクは `/admin/audit` の UI を変更する（batchId filter input の追加・audit row への batchId 表示と copy ボタン）。
そのため visualEvidence は VISUAL_ON_EXECUTION とし、**実装サイクルで実 UI に対する手動スクリーンショットを取得**する。
Local UI implementation is present; screenshot capture is **pending_user_gate** because it requires an authenticated admin runtime.

---

## 2. 取得する canonical screenshot（実装サイクルで取得）

実装サイクル完了後、以下 3 枚を canonical 名で取得し `outputs/phase-11/` 配下に保存する。

| # | canonical 名 | 取得条件 | 検証観点 |
| --- | --- | --- | --- |
| 1 | `audit-batchid-filter-empty.png` | `/admin/audit` を開いた初期状態（batchId 未入力） | batchId filter input（`<FormField name="batchId">` + `<Input placeholder="batch-id (uuid)">`）が from/to の後・limit の前の grid セルに描画され、helper text（from/to·action 併用推奨）が表示される。既存 filter（action / actorEmail / targetType / targetId / from / to / limit）の配置が崩れない。 |
| 2 | `audit-batchid-filter-applied.png` | bulk 操作の batchId(UUID) を入力 → 検索した絞り込み結果 | 入力した batchId を持つ bulk tag audit row のみが表示される（AC-1）。action filter と併用した場合は両条件 AND の結果になる（AC-3）。「次のページ」リンクがある場合 href に batchId が残る（AC-4）。 |
| 3 | `audit-row-batchid-copy.png` | batchId を含む audit row の batchId 表示ブロック + copy ボタン（copied フィードバック状態を含むと尚良） | `batchId: <code>{uuid}</code>` と copy ボタン（「コピー」/ 押下後「コピー済み」）が描画される（AC-2）。batchId を持たない行には batchId ブロックが出ない。 |

> screenshot 名は固定（canonical）。実装サイクルで上記 3 枚を取得し、PR 本文（Phase 13）から参照する。

---

## 3. 3 層評価の計画

### 3.1 Semantic 評価（意味・正しさ）

| 観点 | 確認内容 | 対応 AC |
| --- | --- | --- |
| filter 入力 → 絞り込み表示 | batchId(UUID) を入力して検索すると、その batchId を after_json（assign）または before_json（unassign）に持つ row のみ表示される。不一致 UUID は空表示（「該当する監査ログはありません。」）。 | AC-1 |
| action filter 併用 | `action=admin.member.tag_assigned` と batchId を併用すると、両条件 AND の結果のみ表示される。 | AC-3 |
| cursor 保持 | 結果が複数ページのとき「次のページ」リンクの href に batchId query が残存する。 | AC-4 |
| batchId 表示 | batchId を持つ row に `<code>` で UUID が表示される。持たない row には表示されない。 | AC-2 |
| copy 動作 | copy ボタン押下で clipboard に batchId がコピーされ、「コピー済み」フィードバックが約 1.5s 表示後「コピー」に戻る。 | AC-2 |
| PII マスキング非回帰 | batchId 表示追加後も既存 JSON disclosure の PII マスキング（email/phone/name）が維持される。 | 非回帰 |

### 3.2 Visual 評価（見た目・トークン整合）

| 観点 | 確認内容 |
| --- | --- |
| OKLch token 整合 | batchId filter input / batchId 表示 / copy ボタンの色がすべて OKLch token 由来（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 無し）。CI gate `verify-design-tokens` と整合。 |
| primitives 再利用 | filter は `FormField` + `Input`、copy ボタンは既存 `Button`（variant=ghost / size=sm）、batchId は `<code>` を再利用。新規 primitive を生やしていない。 |
| レイアウト非破壊 | batchId フィールド追加で既存 grid（`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`）の折り返しが自然で、検索/リセットボタン行が崩れない。 |
| copy 状態遷移 | 「コピー」→「コピー済み」→「コピー」の表示遷移が視認できる。 |

### 3.3 AI UX 評価（運用者体験）

| 観点 | 確認内容 |
| --- | --- |
| 探索容易性 | placeholder `batch-id (uuid)` と helper text で、batchId が何か・どう併用すべきか（from/to·action 併用推奨）が運用者に伝わる。 |
| 追跡フロー | 1 つの bulk 操作の row（assign + unassign 双方）を batchId 1 つで一覧でき、JSON 目視（手作業 inspection）が不要になる。 |
| copy の即時性 | copy ボタンで batchId をワンクリック取得でき、別画面（issue / メモ）への貼り付けが容易。 |

---

## 4. アクセシビリティ（a11y）検証観点

| 観点 | 確認内容 |
| --- | --- |
| copy ボタン aria-label | copy ボタンに `aria-label={`batchId ${batchId} をコピー`}` が付与され、スクリーンリーダで対象が判別できる。 |
| clipboard fallback | `navigator.clipboard` 不在 / 権限拒否時に例外を握り潰し、copied フィードバックを出さず黙って復帰する（UI が壊れない）。`<code>` の手動選択で代替コピーが可能。 |
| filter input ラベル関連付け | `<FormField name="batchId" label="batchId">` により `<label>` と `<input>` が `htmlFor`/`id` で関連付く（`getByLabelText("batchId")` で取得可能）。 |
| キーボード操作 | copy ボタンが `<Button type="button">` でフォーカス可能・Enter/Space で発火する。 |

---

## 5. 手動テスト手順（実装サイクルで実施）

1. staging（または local dev）で admin 認可済みセッションを用意する。
2. 事前に bulk tag 操作（`POST /members/tags/bulk`）を 1 回実行し、batchId を 1 つ控える（または既存 audit から batchId を取得）。
3. `/admin/audit` を開き、初期状態を `audit-batchid-filter-empty.png` で撮る。
4. batchId filter input に控えた UUID を入力 → 検索 → 絞り込み結果を `audit-batchid-filter-applied.png` で撮る。
5. action filter（`admin.member.tag_assigned`）を併用して AND 絞り込みが効くことを確認する（AC-3）。
6. batchId を含む row の batchId 表示 + copy ボタンを `audit-row-batchid-copy.png` で撮る。copy 押下で「コピー済み」表示と clipboard 反映を確認する（AC-2）。
7. 結果が複数ページの場合、「次のページ」リンク href に batchId が残ることを確認する（AC-4）。
8. 結果を `outputs/phase-11/manual-test-result.md`（別途作成）に記録する。

> 上記手順・screenshot 取得・staging 操作はすべて user-gated（実装サイクルで明示承認後に実施）。

---

## 6. 参照

- 実行結果記録先: `outputs/phase-11/manual-test-result.md`（別担当が作成）
- Phase 2 設計（UI 配置 / copy 仕様 / extractBatchId）: `phase-2-design.md` §4・§5
- Gate-C 最終受入基準: `phase-10-final-review.md`

---

## 完了条件 (DoD)

- 3 層評価（Semantic / Visual / AI UX）の観点が AC にマップされて記述されている。
- 取得する canonical screenshot 3 名（`audit-batchid-filter-empty.png` / `audit-batchid-filter-applied.png` / `audit-row-batchid-copy.png`）と各検証観点が明記されている。
- a11y 観点（copy ボタン aria-label / clipboard fallback / ラベル関連付け）が記述されている。
- VISUAL_ON_EXECUTION につき authenticated runtime screenshot は pending_user_gate である旨が明記されている。
- 実行結果記録先 `outputs/phase-11/manual-test-result.md` への参照がある。
