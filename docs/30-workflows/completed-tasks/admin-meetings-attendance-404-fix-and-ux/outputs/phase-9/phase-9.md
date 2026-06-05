**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 9: 品質保証

`taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 9.1 品質ゲート方針

本タスクは **apps/web 内 4 ファイル + テスト**の編集タスク（新規 product file 作成・file 削除なし）。
編集対象は `route.ts` / `MeetingTimeline.tsx` / `MeetingAttendanceDrawer.tsx` / `MeetingsClientShell.tsx` と対応 spec のみ。

| 一般ゲート | 本タスクでの扱い |
| --- | --- |
| line budget（生成行数上限） | **N/A** — 既存ファイルへの小〜中差分。新規 product file なし |
| mirror parity（生成物の左右一致） | **N/A（該当なし）** — 変更は `apps/web` 配下に閉じる。skill / docs の mirror 生成物を持たないタスクのため parity 検証は不要。`apps/api` 等への波及がないことを grep で確認するに留める |
| FB-UI-02-1（ファイル削除判定） | **N/A** — 削除対象なし。`route.ts` / 各 component への live import は維持 |
| link（参照リンク健全性） | 編集ファイル間の import（`getAuthEnv` / `useAdminMutation` / `FormField` / primitive / `MemberCandidate`）が解決すること（typecheck で担保） |

実施する品質ゲートは下表の **一括判定セット**に限定する。

## 9.2 品質ゲート一括判定セット

| # | ゲート | コマンド | 期待結果 |
| --- | --- | --- | --- |
| 1 | 型チェック | `mise exec -- pnpm typecheck` | green（型エラー 0） |
| 2 | lint | `mise exec -- pnpm lint` | green（違反 0。残れば `pnpm lint --fix` → 手修正） |
| 3 | focused vitest（A） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts 'apps/web/app/api/admin/[...path]/route.spec.ts'` | transport 3 分岐（binding / HTTP / 500）+ admin gate・sync bearer 既存回帰 PASS |
| 4 | focused vitest（B） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx` | バッジ / 氏名表示 / 導線 / attendedCounts 配線 + 既存回帰 PASS |
| 5 | OKLch token gate | `verify-design-tokens`（CI gate / task-18） | 新規 HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` ゼロで PASS |
| 6 | OKLch ローカル grep | §9.3 の grep 手順 | 4 ファイルに HEX / 任意色クラス 0 件 |
| 7 | `*.test.*` 不在確認 | §9.4 の grep 手順 | 新規 test が `*.spec.{ts,tsx}` のみ。`*.test.*` 0 件（不変条件 #8） |
| 8 | legacy hook 未参照 grep | §9.5 の grep 手順 | `@/lib/useAdminMutation` 新規参照 0 件（不変条件 #10） |

---

## 9.3 ゲート 5・6: OKLch トークン準拠（HEX / 任意色クラス ゼロ確認）

Task B でバッジ・muted memberId・導線テキストを追加するため、色指定が token 経由であることを機械確認する。
`verify-design-tokens` gate（task-18）の通過条件 = 変更 diff に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規導入が存在しないこと。

```bash
# 変更 4 ファイルに HEX 直書き・任意値色クラスが無いことを確認（期待: 全て 0 件 / exit 1）
grep -nE '#[0-9a-fA-F]{3,8}\b' \
  apps/web/app/api/admin/\[...path\]/route.ts \
  apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx \
  apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx \
  apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx

grep -nE '(bg|text|border)-\[#' \
  apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx \
  apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx \
  apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx
```

- 色が必要な箇所（バッジ・muted memberId）は既存 token 変数 / `admin-*` class（例 `admin-timeline__*`）経由で指定する。
- 新規 class が要る場合のみ `tokens.css` の token 変数経由で追加し、HEX を `tokens.css` 以外に書かない（正本順位: tokens.css / design-tokens.md）。
- 判定: 上記 grep が全て 0 件（HEX/任意色クラスの新規導入なし）→ ゲート 5/6 PASS。

---

## 9.4 ゲート 7: `*.test.*` 不在確認（不変条件 #8）

新規/編集 test は `*.spec.{ts,tsx}` のみ。`*.test.*` を新規作成しない（lefthook `block-test-suffix` / CI `verify-test-suffix` が reject）。

```bash
# 本タスク編集ディレクトリ配下に *.test.* が無いことを確認（期待: 0 件）
find apps/web/app/api/admin -name '*.test.ts' -o -name '*.test.tsx'
find apps/web/src/features/admin/components/_meetings -name '*.test.ts' -o -name '*.test.tsx'
```

- 期待出力: なし（0 件）。proxy route spec は既存配置 `apps/web/app/api/admin/[...path]/route.spec.ts`、component spec は `_meetings/__tests__/Meeting*.spec.tsx` の命名のみ。

---

## 9.5 ゲート 8: legacy hook 未参照 grep（不変条件 #10）

```bash
# 編集 4 ファイルに legacy @/lib/useAdminMutation 参照が無いことを確認（期待: 0 件）
grep -rn "lib/useAdminMutation" \
  apps/web/app/api/admin/\[...path\]/route.ts \
  apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx \
  apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx \
  apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx
```

- `MeetingsClientShell` の import は `@/features/admin/hooks/useAdminMutation` のまま維持。
- 期待出力: なし（0 件）。

---

## 9.6 mirror parity が不要な根拠（明示）

本タスクの変更は **すべて `apps/web` 配下のランタイムコード**であり、skill index / docs の左右ミラー生成物（`.claude/skills/*/indexes` 等）を一切生成・変更しない。
したがって mirror parity（root ↔ outputs の byte 一致、symlink 同一性）の検証は **本実装には該当しない**。
唯一の確認は「変更が `apps/web` に閉じ `apps/api` / D1 / Google Form に波及していないこと」であり、これは Phase 8.5 / Phase 10.4 のスコープ確認 grep で担保する。

---

## 9.7 失敗時の自動修復方針

| ゲート | 失敗時対応 |
| --- | --- |
| typecheck | binding 型（`getAuthEnv().API_SERVICE` の `ServiceBinding | undefined`）、`attendedCountOf?` の関数型、`nameOf.get(mid)` の `string | undefined` 処理を最小差分で修正 |
| lint | `pnpm lint --fix` 試行 → 残る違反のみ手修正 |
| vitest（A） | binding/HTTP/500 の mock 切り分けを確認。特に test 隔離（`INTERNAL_API_BASE_URL` あり時 binding 不使用）が効いているか確認。admin gate・sync bearer の既存ケース red は中継ロジック退行を疑う |
| vitest（B） | バッジ値が `attended` state 由来か（stale 検出）、氏名 fallback ケースが Map 不在で memberId を返すかを assertion で確認 |
| token gate | §9.3 grep で混入 HEX/任意色クラスを特定し token 変数へ置換 |

## 9.8 品質判定

**GATE: PASS（実装後に上記 8 ゲートが all-green であること）** — line budget / FB-UI-02-1 / mirror parity は N/A（apps 配下に閉じる）。実施ゲートは typecheck / lint / focused vitest(A,B) / OKLch token(gate+grep) / `*.test.*` 不在 / legacy hook grep の一括セット。admin mutation（tags/member/requests）回帰なし（同 proxy 経路）を必須条件とする。
