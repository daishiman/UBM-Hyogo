# issue-1189 followup 001 / MemberDrawer ミューテーション後の会員一覧反映 - タスク指示書

## メタ情報

```yaml
issue_number: 1242
status: 未着手
```

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | issue-1189-followup-001-member-drawer-mutation-list-refresh |
| タスク名     | MemberDrawer のミューテーション後に会員一覧を即時反映する |
| 分類         | 改善（管理 UI の状態同期・UX 整合） |
| 対象機能     | `/admin/members` の会員一覧 ↔ MemberDrawer 状態同期 |
| 優先度       | 低 |
| 見積もり規模 | 小規模 |
| ステータス   | 未着手 |
| GitHub Issue | #1242 |
| 発見元       | `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/outputs/phase-12/unassigned-task-detection.md` の Phase 12 独立監査（gap 4-A・2026-06-14） |
| 発見日       | 2026-06-14 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`issue-1189-deleted-member-410-guidance-and-restore` で `MemberDrawer` に復元ボタンを配線した（C2）。
復元成功時 `onUpdated({ status: { ...detail.status, isDeleted: false } })` により **drawer 内 detail view は即時更新**される（AC-5 充足）。
しかし背後の会員一覧テーブルは `MembersClientShell` が server props `initial.members` で描画しており、drawer からの変更を知らない。

### 1.2 問題点・課題

- `apps/web/src/features/admin/components/_members/MembersClientShell.tsx:145` は `<MemberDrawer memberId onClose />` のみを渡し、一覧を更新する `onUpdated` / `router.refresh()` を drawer に配線していない。
- `onClose={() => setOpenMemberId(null)}`（同 L145）は drawer を閉じるだけで一覧を再取得しない。
- 一覧再取得 `router.refresh()` は bulk republish 系（L100 / L126）にのみ存在し、単票 drawer ミューテーションには存在しない。
- `MemberDrawer.tsx` 内の `onUpdated`（L98/L110）は drawer 自身の detail view 更新に閉じており、親一覧へは伝播しない。
- 結果として、会員を復元 → drawer を閉じても、一覧の該当行は手動リロードまで「退会済み」表示のまま残る。

> これは restore 固有ではなく **drawer 全ミューテーション共通の既存挙動**である（status 更新・profile 更新も同様に一覧へ反映されない）。
> `issue-1189` の AC-5 は「drawer 表示の即時更新のみ」と明示スコープ済みのため、本件は 1189 のスコープ外として分離した。

### 1.3 放置した場合の影響

- 管理者が「復元したはずなのに一覧でまだ退会済み」と誤認し、二重操作や問い合わせを招く
- drawer 内 status / profile 更新でも同じ齟齬が残り、管理 UI 全体の信頼性が下がる
- 「リロードすれば直る」前提の運用が常態化し、UX 改善の負債が累積する

---

## 2. 何を達成するか（What）

### 2.1 目的

drawer の単票ミューテーション（復元 / status 更新 / profile 更新等）成功後に、会員一覧の該当行が最新状態へ反映される導線を追加し、AC-5 を退行させずに一覧 staleness を解消する。

### 2.2 最終ゴール

- drawer で会員を復元 → drawer を閉じた時点（または成功時点）で一覧の該当行が `isDeleted=false` 反映状態になる
- status 更新 / profile 更新でも同様に一覧が最新化される
- drawer 内 detail view の即時更新（AC-5）は退行しない
- typecheck / lint / focused vitest 全 PASS・`apps/api` 差分ゼロ

### 2.3 スコープ

#### 含むもの

- `MembersClientShell` ↔ `MemberDrawer` の一覧反映配線（`onClose` 時の `router.refresh()` 配線、または drawer→shell への `onUpdated` 伝播のいずれか）
- 反映導線の回帰テスト（drawer ミューテーション後に一覧が更新されること）

#### 含まないもの

- `apps/api` / D1 schema / Google Form 変更
- 新 endpoint 追加
- drawer 内 detail 更新ロジック（AC-5 で実装済み・退行禁止）
- commit / push / PR 作成

### 2.4 成果物

- `MembersClientShell.tsx`（+ 必要なら `MemberDrawer.tsx`）の一覧反映配線差分
- 反映導線の回帰テスト（VISUAL でない NON_VISUAL 証跡で足りるが、見た目変化を伴う場合は VISUAL 扱い）
- typecheck / lint / focused vitest の証跡

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `issue-1189` の C2（MemberDrawer 復元ボタン配線）が landed していること
- 既存の bulk republish 系 `router.refresh()` パターン（`MembersClientShell.tsx:100 / 126`）を参照できること

### 3.2 依存タスク

- 親: `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/`

### 3.3 必要な知識

- Next.js App Router の `router.refresh()`（server component 再取得）の挙動と、client state（drawer detail）との二重管理の整理
- `MembersClientShell` の `initial.members`（server props）描画と drawer ミューテーションの関係
- 不変条件 #10（admin mutation は `@/features/admin/hooks/useAdminMutation` 経由）

### 3.4 推奨アプローチ

最小変更としては、drawer の `onClose`（あるいはミューテーション成功 callback）から `MembersClientShell` の `router.refresh()` を呼ぶ配線が素直。
ただし `router.refresh()` は drawer detail の client state を上書きしうるため、AC-5（drawer 即時更新）が退行しないよう **drawer を閉じた後に refresh する**順序、または `onUpdated` を shell まで bubble up して一覧 state を patch する方式を選ぶ。
既存 bulk republish の `onCompleted={() => router.refresh()}` パターン（L126）に揃えると一貫性が高い。

---

## 4. 実行手順

### Phase 1: 反映方式の決定

#### 目的

`router.refresh()` 配線か `onUpdated` bubble-up かを、AC-5 退行リスクで比較し決定する。

#### 手順

1. `MembersClientShell.tsx` の既存 `router.refresh()` 利用箇所（L100 / L126）と drawer 配線（L145）を確認
2. drawer detail の client state（AC-5）と一覧 server state の二重管理を整理
3. AC-5 を退行させない方式を選定

#### 完了条件

- 反映方式が決定し、AC-5 退行が起きない順序が明文化されている

### Phase 2: 配線実装

#### 目的

決定方式で一覧反映を配線する。

#### 手順

1. `MembersClientShell.tsx`（必要なら `MemberDrawer.tsx`）に反映導線を実装
2. admin mutation は `useAdminMutation` 経由を維持（#10）
3. focused vitest で AC-5 非退行＋一覧反映を確認

#### 完了条件

- drawer ミューテーション後に一覧が最新化され、drawer 即時更新も維持される

### Phase 3: 締め

#### 目的

回帰なしを確認する。

#### 手順

1. `mise exec -- pnpm typecheck` / `lint`
2. focused vitest（members 関連 spec + MemberDrawer.restore.spec）
3. `git diff --name-only -- apps/api` が空であることを確認

#### 完了条件

- typecheck / lint / focused vitest green・`apps/api` 差分ゼロ

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] drawer で復元 → 一覧の該当行が最新化される
- [ ] status 更新 / profile 更新でも一覧が反映される
- [ ] drawer 内 detail view の即時更新（AC-5）が退行しない

### 品質要件

- [ ] admin mutation が `useAdminMutation` 経由（#10）
- [ ] `apps/api` / D1 / Google Form 差分ゼロ
- [ ] typecheck / lint / focused vitest green

### ドキュメント要件

- [ ] 反映方式の決定根拠（AC-5 退行回避）が記録されている
- [ ] NON_VISUAL（または見た目変化時 VISUAL）証跡が残っている

---

## 6. 検証方法

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"
git diff --name-only -- apps/api
```

期待: typecheck / lint exit 0。focused vitest green。`apps/api` 差分なし。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| `router.refresh()` が drawer detail の client state を上書きし AC-5 が退行する | 高 | 中 | drawer を閉じた後に refresh する順序、または `onUpdated` bubble-up で一覧 state のみ patch する方式を選ぶ |
| drawer の他ミューテーション（status / profile）にも波及して想定外の再取得が増える | 中 | 中 | 反映トリガを「成功時のみ」に限定し、不要な refresh を増やさない |
| 一覧 server state と drawer client state の二重管理で表示が一瞬ちらつく | 低 | 中 | 既存 bulk republish の `onCompleted={() => router.refresh()}` パターンに揃え、挙動の一貫性を保つ |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/outputs/phase-12/unassigned-task-detection.md`

### 参照コード

- `apps/web/src/features/admin/components/_members/MembersClientShell.tsx:100 / 126 / 145`
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx:98 / 110 / 117-139`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | drawer で会員を復元しても、背後の会員一覧テーブルは手動リロードまで「退会済み」表示のまま残る。drawer 内 detail view（AC-5）は即時更新されるのに一覧だけ stale。 |
| 原因 | `MembersClientShell.tsx:145` が `<MemberDrawer memberId onClose />` のみで一覧反映用の `onUpdated` / `router.refresh()` を drawer に配線していない。`onClose` も `setOpenMemberId(null)` のみで再取得しない。一覧は server props `initial.members` 由来で client mutation を知らない。 |
| 対応 | drawer 成功 callback または `onClose` から `router.refresh()` を呼ぶ（既存 bulk republish の `onCompleted={() => router.refresh()}` パターンに揃える）か、`onUpdated` を shell まで bubble up して一覧 state を patch する。AC-5 退行を避ける順序を選ぶ。 |
| 再発防止（future-self への観点） | (1) **drawer detail（client state）と一覧（server state）は二重管理になる**ため、片方を更新したらもう片方の反映導線を必ずセットで設計する。(2) `router.refresh()` は drawer detail を上書きしうるので「閉じた後に refresh」または「state patch」で AC-5 を守る。(3) restore 固有でなく drawer 全ミューテーション共通の問題なので、status / profile 更新も同じ導線で一括解消する。(4) 既存 bulk republish パターン（`MembersClientShell.tsx:126`）に揃えると一貫性が出る。 |

### 補足事項

本タスクは `issue-1189` の AC-5（drawer 即時更新のみ）の明示スコープ外として分離した followup である。
restore 固有ではなく drawer 全ミューテーション共通の UX 改善であり、優先度は低。commit / push / PR 作成はスコープ外。
