# Phase 3 — 設計レビュー

**[実装区分: 実装仕様書 / implementation_mode: new]**

> Phase 1（要件）/ Phase 2（設計・SSOT）を 4 条件で評価し、Phase 4 への進行可否を判定する。
> D7（自前 dialog 不採用）の本タスク内再判断を確定記録する（issue #1089 の核心ジレンマ）。

---

## 1. 一次結論（4 条件評価）

| 条件 | 評価 | 根拠 |
|------|------|------|
| **価値性** | ✅ 充足 | 管理者の「破壊的 backfill の不安」を、実行前の実数提示で解消。誰の(管理者)どのコスト(誤実行リスク・件数不明の不安)をどれだけ(承認文言に実数埋込)下げるか定義済み |
| **実現性** | ✅ 充足 | 同 `_sync` 配下に dry-run の参考正本（`BackfillPublishStatePanel`）が landed 済。pagination helper も既存再利用。初回スコープで 1 PR 完了可能な厚み |
| **整合性** | ✅ 充足 | 責務境界（UI/diagnostics/route/job）・状態所有権・read-only invariant が矛盾なく閉じる。preview は write path と分離（DD1）。既存契約（`SyncResultSchema` / `?fullSync`）不変（AC-3） |
| **運用性** | ✅ 充足 | preview は read-only ゆえ運用副作用なし。staleness gate（DD4）で誤承認を構造防止。spec sync・回帰テスト（TC-B1..B8 維持）が破綻しない |

> **総合判定: 4 条件すべて充足。Phase 4（テスト作成）へ進行可。**

---

## 2. 真の論点の再確認

- **主問題**: 破壊的全件 backfill の実行前に、実数根拠の件数を提示できるか。
- **混在切り分け**: 「件数提示（本タスク）」と「sync write 挙動変更（スコープ外）」を分離。preview は read-only に閉じ、`processResponse` を触らない。
- **why now / why this way**: index.md §1・phase-1 §1 で確定済。

---

## 3. 因果と境界の確認

### 強化ループ / バランスループ

- 強化: 「件数提示 → 承認の確信 → backfill 実行 → 反映成功 → UI 操作への信頼」。
- バランス: 「preview 後の他操作 → preview stale → `canBackfill=false` → 再 preview 強制」（DD4）。古い件数での承認を防ぐ自己抑制。

### 状態所有権

- `previewResult` / `lastResult` / `mode` は UI 単独所有。集計は job レイヤ単独所有（AC-2）。混在なし（phase-2 §1）。

### verify fail 後の意思決定権

- preview schema mismatch → `parseError` 表示 + `canBackfill=false` → 管理者が再試行を判断（UI 層に意思決定権）。

---

## 4. D7 再判断記録（issue #1089 核心ジレンマの結論）

> 親 Task B Phase 3 §5 D7: 「`globalThis.confirm` 直接採用・自前 dialog は over-scope のため不採用」。
> issue #1089 はこの D7 と件数プレビューの衝突を「着手時に再評価せよ」と要求している。

| 選択肢 | 内容 | 採否 | 理由 |
|--------|------|------|------|
| (a) confirm 文言への件数埋め込み（最小・D7 整合） | preview で取得した実数を `globalThis.confirm` 文言へ埋め込む | **採用（一部）** | D7 維持。実数を承認の瞬間に提示できる |
| (b) 自前 dialog 化 | modal component を新設して件数プレビュー UI を作る | **不採用** | D7（over-scope）と衝突。新規 primitive 禁止（prototype alignment §3）。コスト過大 |
| (c) staged dry-run ボタン + 結果テーブル表示 | `BackfillPublishStatePanel` 同様に preview ボタン → 結果パネルへ件数表示 → confirm | **採用** | (a) と組合せ。dialog でなく既存パネル内表示ゆえ D7 整合。sibling と UX 統一 |

> **結論（DD3 確定）**: **(c) staged dry-run ボタン + (a) confirm 文言への実数埋め込み** を採用。
> 自前 dialog (b) は不採用とし D7 を本タスクでも維持する。これにより issue #1089 の
> 「件数プレビュー」を D7 と衝突させずに実現する。

---

## 5. 価値とコストの均衡

| 項目 | 初回価値 | コスト |
|------|---------|--------|
| backend count-only 経路 | 実数根拠の提示（AC-2 の前提） | 中（新関数 + pagination 共有・Forms API 追加読取） |
| staged UI flow | 承認前件数提示（AC-1） | 小（sibling パターン流用） |
| confirm 文言埋め込み | 承認の瞬間に実数提示 | 極小 |

> 将来拡張（例: preview 件数のキャッシュ、preview 中のキャンセル）は初回価値と混同せず、Phase 12 の未タスク候補へ回す。

---

## 6. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| preview が Forms API を全件ページングしレイテンシ大 | 中 | `capped`(>100 page) で打ち切り表示。preview は手動操作起点（自動実行しない） |
| preview と実 backfill の件数が乖離（API 状態変化） | 低 | preview は「見込み件数」と明示。staleness gate（DD4）で乖離窓を最小化 |
| 既存 `?fullSync` 経路の退化 | 高 | route の dryRun 分岐は `if (dryRun) {...return}` の前置のみ。既存経路は無改変（AC-3・回帰テスト TC-B1..B8 維持） |
| `estimateResponseWrites` の推定が実 write と乖離 | 低 | UI で「推定」と明示ラベル（DD2）。主指標は実数 `responseCount` |

---

## 7. Phase 4 進行判定（Gate-A）

- [x] 4 条件すべて充足
- [x] D7 再判断を確定記録（DD3）
- [x] 責務境界・状態所有権が閉じている
- [x] 既存契約不変（AC-3）が設計上保証されている
- [x] リスクに対策がある

> **Gate-A 判定: PASS。Phase 4（テスト作成 / TDD Red）へ進行する。**

---

## 完了条件

- [x] 4 条件評価を一次結論として提示した
- [x] 因果ループ・状態所有権・意思決定権を記述した
- [x] D7 再判断（DD3）を選択肢比較付きで確定した
- [x] 価値とコストの均衡・将来拡張の分離を記述した
- [x] リスクと対策を表で固定した
- [x] Gate-A 進行判定を記録した
