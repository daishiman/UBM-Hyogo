# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 の実装設計の妥当性を判定する Phase。GO 判定が出ない限り Phase 4 以降の実装に進めない gate。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SERIAL-05-STEP-01 members-note mutation UI |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | pending |

## 目的

Phase 2 の設計を **PASS / MINOR / MAJOR** で判定し、Phase 4 開始可否（GO / NO-GO）を確定する。

## レビュー観点

### 1. API 契約整合性

- [ ] `apps/api/src/routes/admin/member-notes.ts` の正常応答 shape と hook の `T` 型が一致しているか
- [ ] error response の `{ ok: false, error, message? }` を hook の error parse が網羅しているか
- [ ] `requireAdmin` middleware の 401/403 throw を hook が `FetchAuthedError` に変換できるか

### 2. UI prototype alignment

- [ ] NoteForm の primitives が `docs/00-getting-started-manual/claude-design-prototype/` の既存 form primitive と一致しているか
- [ ] 新規 primitive を生やしていないか
- [ ] design token のみで色 / radius / spacing を表現しているか（HEX 直書き / arbitrary value 禁止）

### 3. state 管理

- [ ] `MemberDrawer.tsx` の既存 state（`memberId`, `onClose` 等）と新規 state（`isEditingNote`, `editingNoteId`）が衝突しないか
- [ ] `notes` 配列が drawer 既存 fetch に含まれるか（含まれない場合 MAJOR）

### 4. 並行リクエスト防止

- [ ] `isSubmittingRef` による二重送信防止が hook 設計に含まれているか（RT-04 知見）

### 5. test 戦略

- [ ] hook test で `router.refresh()` mock 検証が含まれているか
- [ ] hook test で 401 throw の挙動が検証されているか
- [ ] NoteForm test で validation error path がカバーされているか

### 6. simpler alternative 検討

| 代替案 | 検討結果 |
| --- | --- |
| hook を作らず NoteForm 内で直接 fetch | step-02..05 で 5 重複 → **不採用** |
| `router.refresh()` をやめて手動 state 更新 | hook の責務が肥大化 → **不採用** |
| zod を使わず手動 validation | 既存 stack に zod あり → **採用しない理由なし** |

## 判定マトリクス

| ID | 観点 | 判定（PASS/MINOR/MAJOR） | 戻り先 |
| --- | --- | --- | --- |
| R-01 | API 契約 | TBD | Phase 1 (MAJOR時) |
| R-02 | prototype alignment | TBD | Phase 2 (MINOR/MAJOR時) |
| R-03 | state 衝突 | TBD | Phase 2 (MAJOR時) |
| R-04 | 並行防止 | TBD | Phase 2 (MAJOR時) |
| R-05 | test 戦略 | TBD | Phase 2 (MINOR時) |

## MINOR 追跡テーブル

| MINOR ID | 内容 | 解決予定Phase | 解決確認Phase |
| --- | --- | --- | --- |
| TBD | TBD | Phase 6 or 7 | Phase 9 / 10 |

## NO-GO 条件

- 上記レビュー観点に MAJOR が 1 件でもある
- `notes` 配列が既存 drawer fetch に含まれず、API 拡張が必要と判明（→ scope 外 / parent task escalate）
- toast library / `FetchAuthedError` 型の依存先が未特定

## GO 条件

- 全観点が PASS or MINOR（MINOR は解決予定 Phase が確定）
- simpler alternative が文書化済

## 実行タスク

- [ ] レビュー観点 1-6 を `outputs/phase-03/review-result.md` に記録
- [ ] PASS / MINOR / MAJOR 判定を全観点に対して付与
- [ ] MAJOR があれば該当 Phase に戻る指示を記載
- [ ] simpler alternative 検討結果を記録
- [ ] GO / NO-GO を `outputs/phase-03/gate-decision.md` に確定

## 成果物

- `outputs/phase-03/review-result.md`
- `outputs/phase-03/gate-decision.md`

## 完了条件

- [ ] 全レビュー観点に判定済
- [ ] gate-decision.md に GO / NO-GO 明記
- [ ] MINOR があれば追跡テーブル埋まっている
- [ ] coverage AC（Statements/Branches/Functions/Lines >=80%）変更なしを確認

## タスク100%実行確認【必須】

- [ ] レビュー成果物 2 件 commit-ready
- [ ] GO 判定の場合のみ Phase 4 へ進める

## 次Phase

Phase 4 (タスク分解): GO 判定後、実装サブタスク T1..Tn に分解する。
