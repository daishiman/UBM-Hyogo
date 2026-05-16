# AttendanceList multi-page cursor chain test - タスク指示書

## メタ情報

| 項目         | 内容                                                          |
| ------------ | ------------------------------------------------------------- |
| タスクID     | parallel-04-followup-002-attendance-multi-page-chain-test     |
| タスク名     | AttendanceList.spec.tsx に 2 段以上の cursor 連鎖テストを追加 |
| 分類         | テスト強化                                                    |
| 対象機能     | `apps/web/app/profile/_components/AttendanceList.spec.tsx`    |
| 優先度       | 低                                                            |
| 見積もり規模 | 小規模                                                        |
| ステータス   | 未実施                                                        |
| 発見元       | parallel-04 Phase 12 lessons-learned 補足                     |
| 発見日       | 2026-05-15                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

parallel-04 で追加した `AttendanceList.spec.tsx` は default 50 → 51 件目までの 1 段 cursor 取得をカバーしているが、2 段目以降（51→101, 101→151, ...）の cursor 連鎖と最終 page（`hasMore=false`, `nextCursor=null`）への遷移をカバーしていない。

### 1.2 問題点・課題

- 複数 page chain で cursor が正しく更新されることが focused spec で保証されていない。
- `nextCursor` が `null` を返した時に「もっと見る」ボタンが消えることは E2E evidence では確認されているが、focused spec では未検証。

### 1.3 放置した場合の影響

- cursor 更新 bug が 2 段目以降で発生しても focused test で検出できない。
- 将来 cursor encoding を変更した時の regression が E2E でしか検知できず、修正サイクルが遅くなる。

---

## 2. 何を達成するか（What）

- `AttendanceList.spec.tsx` に以下のケースを追加:
  - **multi-page chain**: fetch mock を `mockResolvedValueOnce` で 2 段連鎖し、51..100 件目→101..150 件目を順次 append すること。
  - **terminal page hide**: `nextCursor: null, hasMore: false` を返した直後に「もっと見る」ボタンが DOM から消えること。
- 既存 fixture（`cursor?x=1&y=2`）の opaque round-trip 検証は維持。

## 3. 受け入れ条件（Acceptance Criteria）

- `pnpm --filter @ubm-hyogo/web test -- AttendanceList.spec` が PASS。
- 追加ケースが既存 7 ケース（要確認）から +2 ケースになること。
- E2E (`attendance-paging-ui-evidence.spec.ts`) 側に変更を加えないこと（focused unit に閉じる）。

## 4. スコープ外

- `hasMore` / `nextCursor` の discriminated union 化（型変更を伴うため別タスク）。
- API contract test の拡張。
