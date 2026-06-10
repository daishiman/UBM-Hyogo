# 410（is_deleted member）の本格対応（復帰 or 明示誘導） - タスク指示書

## メタ情報

```yaml
issue_number: 1189
```

| 項目         | 内容                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| タスクID     | task-410-deleted-member-recovery-or-guidance                                                                        |
| タスク名     | 410（is_deleted member）の本格対応（復帰 or 明示誘導）                                                              |
| 分類         | 本格修正（要合意の仕様分岐）                                                                                        |
| 対象機能     | 退会済み member の `/profile` 扱い                                                                                  |
| 優先度       | low                                                                                                                 |
| 見積もり規模 | 中                                                                                                                 |
| ステータス   | deferred_pending_root_cause                                                                                         |
| 発見元       | profile-session-fetch-failure-investigation Phase 12 unassigned-task-detection                                     |
| 発見日       | 2026-06-09                                                                                                          |
| 親タスク     | docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation                                      |
| タスク種別   | implementation / VISUAL（着手時に再確定）                                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親ワークフロー `profile-session-fetch-failure-investigation` は、staging `/profile` で
「セッション取得に失敗しました」系バナーが表示される事象に対し、**調査 + 観測性向上**を実装した。
具体的には、原因コードを区別表示する `mapProfileSessionErrorToDisplay`
（`apps/web/app/(member)/profile/_lib/session-error-display.ts`）、構造化ログ、診断スクリプトを導入した。

`/profile` Server Component は
`safeServerFetch(() => fetchAuthed("/me"), { codePrefix: "MEMBER_SESSION" })` で `/me` を取得する
（`apps/web/app/(member)/profile/page.tsx`）。API 側の `apps/api/src/middleware/session-guard.ts:95-100` は
`member_status.is_deleted=1` のとき **410 DELETED** を返す。web はこれを `MEMBER_SESSION_410` として受け、
親ワークフロー導入前はデフォルト分岐「時間をおいて再読み込みしてください」へ集約していた（これが画像に出ていた症状）。

親ワークフローで 410 を区別表示できるようにはなったが、**「退会済みユーザーをどう扱うか
（復帰導線を出すのか、明示的な退会済み案内に誘導するのか）」という本格対応は未着手**である。
これが本タスク（C-1）のスコープである。

### 1.2 問題点・課題

- 410 は「session-guard が `is_deleted=1` を検知して意図的に返す正常な拒否」であり、
  5xx（バグ）とは性質が根本的に異なる。観測性タスク（親 WF）では両者を一律集約していたものを
  区別したが、**410 を受けた後の業務的な扱いはプロダクト判断であり、技術判断だけでは決められない**。
- 退会済み member に対して「復帰させるのか」「再登録に誘導するのか」「サポート連絡に導くのか」が未合意。
  文言・フローを真因確定前に作り込むと、真因が実は H4(5xx)/H5(transport) だった場合に丸ごと無駄になる。
- `member_status.is_deleted` は論理削除フラグであり、復帰の技術要件（単に `is_deleted=0` に戻せば足りるのか、
  関連 identity / status の整合を取る必要があるか）が未調査である。

### 1.3 放置した場合の影響

- 退会済みユーザーが `/profile` で「区別表示はされるが、その先の導線がない」状態のまま残り、
  ユーザー体験が宙吊りになる（自分が退会済みであることは分かるが、どうすればよいか分からない）。
- 復帰の業務要件が未定義のままだと、サポート問い合わせが発生したときに対応方針がブレる。
- 親ワークフローの `outputs/phase-12/unassigned-task-detection.md` で
  「真因 H3 確定後に着手」と契約した未タスクが、契約どおり評価されないまま陳腐化する。

---

## 2. 何を達成するか（What）

### 2.1 目的

真因が **H3（410・`member_status.is_deleted=1`）** と確定した場合に、退会済み member が `/profile` を
開いたときの扱いを **合意のうえ確定し、実装する**。「復帰させる」か「明示的に退会済みを案内し再登録/サポートへ誘導する」か
のいずれかを要合意で決め、それに沿った UI / フローを実装する。

### 2.2 最終ゴール

以下のいずれかが達成されていること。

- パターン A（明示誘導）: `/profile` で退会済み member に対し、退会済みである旨と次のアクション
  （再登録 / サポート連絡 等）を明示する案内を表示する。D1 schema・API 410 status 体系は変更しない。
- パターン B（復帰）: 退会済み member を復帰させるフローを設計・実装する。`is_deleted=0` への復帰だけで
  整合が取れるか、関連 identity / status の整合処理が必要かを D1 schema 調査のうえ確定する。
- いずれの場合も、不変条件 #11（`/me/*` は memberId をログ/レスポンスに露出しない）を維持する。

### 2.3 スコープ

#### 含む

- 真因 H3 確定の確認（Phase 11 MT-A / MT-C 結果の参照）
- 退会済み member の業務的扱い（復帰 or 明示誘導）の合意形成と決定記録
- 決定パターンに応じた `/profile` 側 UI / 文言の実装
  （`mapProfileSessionErrorToDisplay` の 410 分岐を起点に拡張）
- パターン B（復帰）採用時は、`member_status.is_deleted` 論理削除の復帰要件を D1 schema 調査のうえ設計

#### 含まない

- 真因が H4(5xx) / H5(transport) と確定した場合の対応（本タスクは H3 確定が前提）
- API の 410 status 体系の変更（`session-guard.ts` の 410 返却ロジック自体は変更しない前提）
- D1 schema の変更（パターン A）。パターン B でも復帰は既存 `is_deleted` フラグ操作の範囲で検討する
- Google Form 仕様変更
- production deploy（リリース責務は別タスク）

---

## 3. どう実現するか（How）

### 3.1 着手前提（必ず先行確認）

1. 親ワークフローの Phase 11 manual-test（MT-A / MT-C）で **真因が H3（410）と確定している**ことを確認する。
   H3 未確定の場合は着手しない（`deferred_pending_root_cause` を維持する）。
2. `apps/api/src/middleware/session-guard.ts:95-100` の 410 返却条件
   （`member_status.is_deleted=1`）を実コードで再確認する。

### 3.2 評価ステップ

1. 退会済み member の実データ状態を D1 read-only で確認する
   （`member_status.is_deleted=1` のレコードと、関連する identity / status の整合状態）。
2. 「論理削除の復帰は `is_deleted=0` に戻すだけで足りるか」を schema 調査で判定する。
   関連タスク `admin-member-detail-status-404-fix` が扱った orphan status 問題と整合が必要かを確認する。
3. プロダクト判断（復帰 or 明示誘導）を要合意で確定し、決定記録を残す。

### 3.3 復帰 vs 誘導の判断基準

| 観点 | 明示誘導（パターン A）を選ぶ条件 | 復帰（パターン B）を選ぶ条件 |
| --- | --- | --- |
| 業務要件 | 退会は確定操作で、自己復帰させない方針 | 誤退会の救済や自己復帰を許容する方針 |
| 整合リスク | 復帰時の identity / status 整合保証が困難 | `is_deleted=0` で整合が取れることを schema で確認済み |
| 実装範囲 | UI 文言 + 誘導リンクのみで完結 | 復帰フロー（操作経路 + 整合処理）が必要 |

判断結果は決定記録として残し、選んだパターンのみ実装する。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/app/(member)/profile/_lib/session-error-display.ts` の 410 分岐 /
  `apps/api/src/middleware/session-guard.ts:95-100`
- 症状: 410 は「session-guard が `is_deleted=1` を検知して**意図的に返す正常な拒否**」であり、
  5xx（バグ）とは性質が違う。観測性タスク（親 WF）では両者を一律集約していたものを区別したが、
  **410 を受けた後の業務的な扱い（退会済みは復帰させるのか、再登録へ誘導するのか、サポート連絡か）は
  プロダクト判断であって技術判断ではない**。真因が H3 と確定する前に文言・フローを作り込むと、
  真因が実は H4(5xx) / H5(transport) だった場合に作業が丸ごと無駄になる罠がある。着手前提（§3.1）の
  H3 確定確認を必ず先に通すこと。
- 参照: `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/_shared-context.md` §3 OUT /
  `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md`

- 対象: `member_status.is_deleted`（論理削除フラグ）/ D1 schema
- 症状: `is_deleted` は論理削除フラグであり、復帰させる場合に **`is_deleted=0` に戻すだけで足りるのか、
  関連 identity / status の整合（`admin-member-detail-status-404-fix` が扱った orphan status 問題と関連）を
  取る必要があるか**を、D1 schema を読んで慎重に判断する必要がある。「フラグを戻せば終わり」と決めてかかると、
  orphan status / identity 不整合を残したまま「復帰したが詳細表示が壊れる member」を生む罠がある。
  また、復帰フロー実装時も不変条件 #11 により `/me/*` は **memberId をログ / レスポンスに露出してはならない**点を
  維持すること。
- 参照: `apps/api/src/middleware/session-guard.ts` / `docs/00-getting-started-manual/specs/08-free-database.md`

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| 真因が H3 でない（H4/H5）のに文言・フローを作り込む | 高 | §3.1 着手前提で Phase 11 MT-A / MT-C の H3 確定を必須化。未確定なら着手しない |
| 退会済みの業務的扱いを技術判断だけで決めてしまう | 高 | 復帰 or 明示誘導はプロダクト判断として要合意。決定記録を残してから実装する |
| 復帰時に `is_deleted=0` のみ戻して identity / status 不整合を残す | 高 | §3.2 で D1 schema 調査。`admin-member-detail-status-404-fix` の orphan status 問題と整合を確認 |
| 復帰フローで memberId を露出する | 中 | 不変条件 #11 を維持。ログ / レスポンスに memberId を出さない |
| API の 410 status 体系を不用意に変更する | 中 | `session-guard.ts` の 410 返却ロジックは変更しない前提を守る（スコープ §2.3） |

---

## 検証方法

### 着手前提（真因確定）の確認

```bash
# 親 WF の真因確定（H3）を Phase 11 結果で確認
cat docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md

# 410 返却条件を実コードで再確認
mise exec -- grep -n "is_deleted" apps/api/src/middleware/session-guard.ts
```

期待: Phase 11 MT-A / MT-C で真因が H3（410・`is_deleted=1`）と確定している。

### D1 read-only 調査（復帰可否判断）

```bash
# 退会済み member と関連 status の整合状態を read-only で確認（実値・memberId は出力しない方針を維持）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command \
  "SELECT COUNT(*) AS deleted_count FROM member_status WHERE is_deleted = 1" --json
```

期待: `is_deleted=1` レコード数と、関連 identity / status の整合状態が把握できる。

### 実装完了の検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待:
- typecheck / lint 全 PASS
- 選択したパターン（A: 明示誘導 / B: 復帰）に応じた `/profile` の挙動が実装されている
- `/me/*` レスポンス・ログに memberId が露出していない（不変条件 #11）

---

## 4. 関連リンク

| 種別 | パス | 用途 |
| --- | --- | --- |
| 親 WF 未タスク検出 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-12/unassigned-task-detection.md` | 本未タスク（C-1）の検出記録・「H3 確定後に着手」契約 |
| 親 WF 共有コンテキスト | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/_shared-context.md` | §3 OUT（スコープ外＝本格対応の保留宣言） |
| 親 WF 手動テスト結果 | `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/outputs/phase-11/manual-test-result.md` | MT-A / MT-C による真因 H3 確定の参照元 |
| API 実装 | `apps/api/src/middleware/session-guard.ts` | 410 DELETED 返却条件（`is_deleted=1`・95-100 行） |
| web 実装 | `apps/web/app/(member)/profile/_lib/session-error-display.ts` | 410 区別表示（`mapProfileSessionErrorToDisplay`・拡張起点） |
| web 実装 | `apps/web/app/(member)/profile/page.tsx` | `safeServerFetch(() => fetchAuthed("/me"), { codePrefix: "MEMBER_SESSION" })` |
| 関連タスク | `admin-member-detail-status-404-fix` | orphan status / identity 整合の前例（復帰時の整合判断の参考） |
| spec | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 構成・`member_status` schema 参照 |
