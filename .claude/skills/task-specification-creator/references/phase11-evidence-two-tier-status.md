# Phase 11 Evidence Inventory — Two-Tier Status Operation

`outputs/phase-12/phase12-task-spec-compliance-check.md` の `## Phase 11 evidence file inventory`
（または番号付き `## 4. Phase 11 evidence file inventory`）表で許容される **2 階層の status 運用** を定義する。

出典: Refs #730 `verify-phase11-evidence-existence.ts` 実装 +
`parallel-02-prototype-css-rules-port`（2026-05-18）での inventory ledger 運用知見。

## 二層モデルの目的

`present` と `pending` を **同じ表内で異なる責務** として運用することで、

1. validator による物理ファイル存在の **強制チェック**
2. 「将来取得予定 / 別タスク gate / runtime に依存」evidence の **ledger 化（一覧の継続性確保）**

を両立させる。validator は `present` のみを検査し、`pending` を warning なしに許容する。

## status 値の責務マトリクス

| status | validator 動作 | 物理ファイル要否 | 用途 | 後続遷移 |
| --- | --- | --- | --- | --- |
| `present` | `existsSync` + `isFile()` で実在を検証。fail 時 `reason: "missing-evidence"` | **必須** | 取得済み・tracked な evidence | 終端（変更があれば再生成して `present` 維持） |
| `pending` | 検査対象外（validator skip） | 不要（path は予約 only でも可） | inventory ledger としての記録：別タスク / runtime / N-day 観測などで後続取得予定 | `present`（取得完了時）/ `n/a`（取得不要が確定したとき） |
| `n/a` | 検査対象外 | 不要 | 当該 evidence を取得しない確定判断 | 終端 |

`Present` / `Pending` / `PENDING` 等の **表記揺れは invalid claim** として fail。lowercase のみ valid。

## `pending` を inventory ledger として使う場面

| シーン | 例 |
| --- | --- |
| 別タスク gate に依存 | parallel-09 visual evidence が後発タスクで取得される場合の先行 inventory 行 |
| runtime / N-day 観測待ち | merge 後 D+7 で aggregate 取得する metrics evidence |
| user gate 待ち | production deploy 後の fresh runtime screenshot |
| 共有ファイル並列編集 | 他 parallel-XX タスクのマーカー block が後発で追加される予告 |

`pending` 行も **path 列は記述する**。path 不在 / ディレクトリ path は validator が `present` 行で fail させるため、`pending` 行であっても予約 path を明示する運用が望ましい（後続置換時の diff を最小化）。

## 表記例

```markdown
## Phase 11 evidence file inventory

| # | Status | Path | Description |
| --- | --- | --- | --- |
| 1 | present | outputs/phase-11/main.md | Phase 11 結果サマリ |
| 2 | present | outputs/phase-11/evidence/typecheck.log | local typecheck PASS |
| 3 | present | outputs/phase-11/evidence/grep-marker.txt | 共有 CSS マーカー検証 |
| 4 | pending | outputs/phase-11/evidence/visual-runtime.png | parallel-09 で取得予定（VISUAL_RUNTIME_PENDING） |
| 5 | n/a    | outputs/phase-11/evidence/production-smoke.log | 本タスクは local 完結のため不要 |
```

## 二層運用での Phase 12 close-out 判定

- `present` 行に欠落があれば **FAIL**（validator が fail 化）
- `pending` 行のみが残る status は **`implemented_local_evidence_captured` または `VISUAL_RUNTIME_PENDING`** などサブ状態と整合させる（[workflow-state-vocabulary.md](workflow-state-vocabulary.md)）
- `pending` 行を `present` に昇格するときは **同 wave で物理ファイルを追加** し、validator 再実行で PASS を確認

## 落とし穴

| 症状 | 原因 | 修正 |
| --- | --- | --- |
| `pending` で記載していたのに validator が fail | 大文字混在 (`Pending`) | lowercase 統一 |
| path 列が空のまま `pending` | inventory ledger が読み取れない | 予約 path を必ず明記 |
| `pending` を放置して `completed` に昇格 | サブ状態語彙不整合 | `VISUAL_RUNTIME_PENDING` / `runtime_pending` 等で suffix |
| 後続 PR で `pending` → `present` 化したが物理ファイル未追加 | validator fail | 同 wave で tracked file 追加 |

## 関連 reference

- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) §「Phase 12 compliance check における Phase 11 evidence 実在性 validator」
- [workflow-state-vocabulary.md](workflow-state-vocabulary.md) `VISUAL_RUNTIME_PENDING` / `implemented_local_evidence_captured`
- [phase12-compliance-check-template.md](phase12-compliance-check-template.md)
- [shared-file-parallel-edit-pattern.md](shared-file-parallel-edit-pattern.md)
