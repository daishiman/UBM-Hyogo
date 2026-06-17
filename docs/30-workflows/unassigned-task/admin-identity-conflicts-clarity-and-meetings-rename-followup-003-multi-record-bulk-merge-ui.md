# Admin Identity Conflicts FU-003 — 3件以上の同一人物を一括統合する UI - タスク指示書

## メタ情報

```yaml
issue_number: 1226
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-clarity-and-meetings-rename-followup-003-multi-record-bulk-merge-ui |
| タスク名 | 3件以上の同一人物を1件にまとめる一括統合 UI |
| 分類 | 機能拡張 |
| 補足分類 | post-MVP（需要次第） |
| 対象機能 | `/admin/identity-conflicts` の統合操作（3件以上一括） |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| GitHub Issue | #1226 |
| 発見元 | `admin-identity-conflicts-clarity-and-meetings-rename` Phase 12 unassigned-task-detection baseline 補足 / shared-context §9 |
| 発見日 | 2026-06-12 |
| canonical source | `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`/admin/identity-conflicts`（会員の重複確認）は、重複候補を **source / target の 2 件ペア** 単位で表示し、1 行ずつ 2 段階確認ダイアログで統合する UI である。検出器（`identity-conflict-detector.ts`）は氏名・職業などの一致をもとに 2 件ペアの候補を返す設計になっている。

### 1.2 問題点・課題

- 同一人物が 3 件以上の登録に分散している場合、現行 UI ではペア統合を複数回繰り返す必要がある。
- 3 件以上の重複は「A=B」「B=C」のように複数のペア候補として個別に並ぶため、運用者が同一人物の塊だと気づきにくく、統合順序や統合先の取り違えが起きやすい。

### 1.3 放置した場合の影響

- 機能上は 2 件ペア統合の反復で達成できるが、運用者の手数と認知負荷が増える。
- ペアを個別に処理すると、まとめ先（canonical）が途中で変わり、意図しない方向に統合してしまう余地が残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

同一人物が 3 件以上に分散しているとき、複数候補をまとめて 1 件に統合できる一括統合 UI を提供し、統合先の選択と確認を 1 つの操作にまとめる。

### 2.2 最終ゴール

- 推移的に同一人物と判定される 3 件以上の登録を 1 グループとして提示できる。
- グループ内のどれをまとめ先（canonical）にするかを運用者が明示的に選べる。
- 一括統合は理由入力と 2 段階確認を維持し、結果が一覧へ反映される。

### 2.3 受け入れ基準

- [ ] 同一人物が 3 件以上の場合、複数ペアを 1 グループに集約して表示する。
- [ ] グループ内のまとめ先（canonical）を運用者が選択できる UI がある。
- [ ] 一括統合は理由入力と 2 段階確認を経て実行される。
- [ ] 統合の途中失敗時に、どこまで統合されたか / 復元状態が運用者に分かる。
- [ ] 既存の 2 件ペア統合 UI の動作が回帰しない。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 候補一覧の構成 / グループ集約の組み立て |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 現行 source/target ペア構造 / 2 段階確認ダイアログ |
| `apps/api/src/services/admin/identity-conflict-detector.ts` | 2 件ペア候補の検出（グループ化の判断材料） |
| `apps/api/src/repository/identity-conflict.ts` | merge mutation（2 件統合前提）の正本 |
| `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md` | 発見元の正本 |

### 3.2 実装方針

- 検出器が返す 2 件ペアを UI 側で推移的にグルーピング（A=B, B=C → A=B=C）し、3 件以上のグループを 1 かたまりとして提示する。
- まとめ先（canonical）を選択する UI を追加し、選択結果に応じて統合方向を確定する。
- merge mutation が 2 件統合前提のままなら、複数回呼ぶ（クライアント側オーケストレーション）か、API を一括統合対応に拡張するかを判断する。後者は API / D1 変更を伴うため独立スコープとして分離する。
- 既存の 2 件ペア統合 UI / mutation contract は不変に保ち、3 件以上の経路を追加する形にする。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` / `apps/web/src/components/admin/IdentityConflictRow.tsx` / `apps/api/src/services/admin/identity-conflict-detector.ts`
- 症状: 検出器は source/target の 2 件ペアで候補を返すため、3 件以上の同一人物は「複数の重複ペア」として個別に出る。UI 側でペアを推移的にグルーピング（A=B, B=C → A=B=C）する必要があり、グラフ的な集約ロジック（連結成分の算出）が要る。
- 参照: `apps/api/src/repository/identity-conflict.ts`（merge は `sourceMemberId` / `targetMemberId` の 2 件前提で audit を記録する）
- 知見: 一括統合は「どれをまとめ先（canonical）にするか」の人間判断 UI と、複数件を 1 トランザクションで統合する原子性（途中失敗時の rollback）が論点。merge mutation が 2 件前提なら、複数回呼ぶ方式は原子性が崩れ、API 拡張するなら API / D1 変更でさらに独立スコープになる。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| ペアのグルーピングが誤り、別人を同一グループに含めてしまう | 高 | 推移的集約の連結成分ロジックに unit test を追加し、まとめ先選択を必須にして人間判断を介在させる |
| merge を複数回呼ぶ方式で途中失敗し、一部だけ統合された中途半端な状態になる | 高 | 失敗時にどこまで統合済みかを運用者へ提示し、API 一括統合（原子性）拡張の要否を事前に判断する |
| まとめ先（canonical）の取り違えで意図しない方向に統合される | 中 | canonical 選択 UI を明示し、2 段階確認に「まとめ先」を表示してから実行する |
| API 拡張に踏み込み、本タスクのスコープが肥大化する | 中 | API / D1 変更を伴う一括統合 endpoint は別タスクとして分離し、本タスクは UI と判断材料に閉じる |

---

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

期待: ペアのグルーピング / canonical 選択 / 2 件ペア統合の回帰の assertion が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium --grep "merge|group|bulk"
```

期待: 3 件以上のグループ表示・まとめ先選択・一括統合後の一覧反映が安定して取得される。

### 静的検証

```bash
rg -n "candidateTargetMemberId|conflictId|sourceMemberId" apps/web/src/components/admin/IdentityConflictRow.tsx apps/web/app/\(admin\)/admin/identity-conflicts/page.tsx
```

期待: 既存の 2 件ペア構造を壊さずにグループ集約が追加されている。

---

## スコープ

### 含む

- 2 件ペア候補の推移的グルーピング（A=B, B=C → A=B=C）。
- 3 件以上のグループ表示と、まとめ先（canonical）選択 UI。
- 一括統合の理由入力 / 2 段階確認 / 一覧反映。
- focused unit / Playwright evidence の更新。

### 含まない

- 一括統合用の新規 API endpoint 追加 / D1 schema 変更（必要な場合は独立タスクとして分離）。
- 既存 2 件ペア統合 / dismiss の mutation contract 変更。
- Google Form schema / 検出器の判定基準そのものの変更。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/`
- 未タスク検出: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md`
- 対象 component: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 候補一覧 page: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
- 検出器: `apps/api/src/services/admin/identity-conflict-detector.ts`
- merge mutation: `apps/api/src/repository/identity-conflict.ts`
