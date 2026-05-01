# Phase 8 成果物: ドキュメント整流化

> ステータス: spec_created / docs-only / NON_VISUAL
> 入力: Phase 1-7 全 outputs、UT-01 上流仕様
> 目的: 用語・数値の表記揺れを抽出し、本 workflow および UT-01 仕様への申し送り表で整流化する。

---

## 1. Before / After 比較テーブル（用語・数値）

| 項目 | Before（揺れ）| After（canonical）| 適用範囲 |
| --- | --- | --- | --- |
| retry max | 3 / 5 / `DEFAULT_MAX_RETRIES` / `SYNC_MAX_RETRIES` | retry max = 3（既定）、`SYNC_MAX_RETRIES` 上書き可、`DEFAULT_MAX_RETRIES` 定数値 = 3 | 本 workflow 全体 + UT-09 実装 |
| backoff base | 1s / 50ms / `baseMs: 50` / `baseMs: 1000` | base = 1s（1000ms） | 本 workflow + `apps/api/src/utils/with-retry.ts` |
| backoff cap | 32s / なし | cap = 32s | 本 workflow + UT-09 |
| jitter | 言及なし / ±0% | ±20%（毎 wait に乱数 ±20%） | 本 workflow + UT-09 |
| offset 単位 | 行 / chunk index / 安定 ID 集合 | chunk index（chunk = batch_size 100 行） | 本 workflow + UT-09 |
| `processed_offset` 列 | 不在 / 追加 | INTEGER NOT NULL DEFAULT 0 | UT-09 / U-UT01-07 |
| sync ledger 物理名 | `sync_log` / `sync_job_logs` | 論理名: `sync_log`、物理名: `sync_job_logs`（U-UT01-07 で再確認） | 本 workflow（直交境界として注記）|
| trigger_type | `manual` / `admin` | `admin`（実装現状を維持、U-UT01-08 で別途整理） | 本 workflow（直交境界）|
| status 値 | `pending/in_progress/completed/failed` / `running/success/failed/skipped` | 現実装 `running/success/failed/skipped` を維持、U-UT01-08 で別途整理 | 本 workflow（直交境界）|

---

## 2. 用語辞書（本タスク内で使う表記）

| 表記 | 定義 |
| --- | --- |
| canonical 値 | 本タスクで採択し UT-09 / U-UT01-07 / U-UT01-08 が follow する単一値 |
| chunk | batch_size 単位（100 行）の処理単位 |
| chunk index | 0 始まりの chunk 通し番号。`processed_offset` の単位 |
| 1 tick | cron 1 周期（既定 6h）|
| worst case | retry 上限到達 + 同時 2 sync + Sheets API 障害断続発生時の上限想定 |
| 過渡期 | 既定値変更（5→3）後、staging で failed しきい値を実測再校正する 7 日間 |
| 軸 1 / 2 / 3 | retry 最大回数 / Backoff curve / `processed_offset` 採否 |

---

## 3. 重複記述の抽出

| 重複箇所 | 出現 | 対応 |
| --- | --- | --- |
| canonical 採択値（retry=3 等） | Phase 2, 3, 5, 7, 9, 10, 12 で必須言及 | Phase 2 を正本とし、他は `outputs/phase-02/canonical-retry-offset-decision.md` への参照リンクで重複を最小化 |
| AC1-AC6 一覧 | Phase 1, 3, 7, 10 | Phase 1 を起点、Phase 3 / 7 / 10 は判定列を追加した派生として位置づけ |
| FC マトリクス | Phase 6 が正本、Phase 7 / 9 で参照 | Phase 6 への参照に統一 |

---

## 4. UT-01 仕様への申し送り（本タスクが上書き / 加筆する箇所）

| UT-01 上流ファイル | 上書き / 加筆対象 | 内容 |
| --- | --- | --- |
| `sync-method-comparison.md` §5 確定パラメータ | 加筆 | retry 3 / backoff curve には jitter ±20% を明記する旨の注記。U-UT01-09 で確定 |
| `sync-log-schema.md` §2 / §9 | 加筆 | `processed_offset` の単位が chunk index であることを明記。U-UT01-09 で確定 |
| `sync-log-schema.md` §9 既存実装対応表 | 加筆 | retry 値差分の解消結果（3 へ寄せ）を反映 |

※ 上記は申し送りのみ。本タスクでは UT-01 ファイル本体を編集しない（completed-tasks 配下のため）。後続 PR / docs-update タスクが反映する。

---

## 5. navigation drift 確認

| 確認項目 | 結果 |
| --- | --- |
| `index.md` の Phase 一覧と `phase-XX.md` 実体の整合 | Phase 1-13 揃い |
| `artifacts.json` の outputs 配列と本 outputs/ 配下の整合 | Phase 1-12 揃い（Phase 13 は PR で空配列） |
| 上流 UT-01 リンク | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/` 配下に到達可能 |
| 既存実装リンク | `apps/api/src/jobs/sync-sheets-to-d1.ts`、`apps/api/migrations/0002_sync_logs_locks.sql` 到達可能 |

---

## 6. 共通化パターン

- 「canonical 値」は Phase 2 ファイルに集約、他 Phase は参照のみ
- 「申し送り先（UT-09 / U-UT01-07 / U-UT01-08）」は各 Phase 末尾の §「次 Phase への引き渡し」または「申し送り」セクションに統一配置

---

## 7. 削除対象

なし（既存ドラフトの上書きはあるが完全削除する記述はない）。

---

## 8. 完了条件チェック

- [x] Before / After 比較テーブル
- [x] 用語辞書（本タスク内表記）
- [x] 重複記述の抽出
- [x] UT-01 への申し送り表
- [x] navigation drift 確認
- [x] 共通化パターン
- [x] コード変更 / migration / PR なし
