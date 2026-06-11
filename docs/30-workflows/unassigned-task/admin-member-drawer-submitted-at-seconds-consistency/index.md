# 会員詳細ドロワー「送信日時」を秒精度表記に統一 — 未タスク仕様書

`task-specification-creator` フォーマット（Phase 1-13 構成）準拠。本ファイルは Phase 1（要件定義）を正本とする
未タスク仕様書であり、実コード実装・outputs/phase-5 以降の成果物生成は範囲外。

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| slug         | `admin-member-drawer-submitted-at-seconds-consistency`                              |
| タスク名     | 会員詳細ドロワー「送信日時」を秒精度表記に統一（一覧「最終更新」列との UX 整合）     |
| 実装区分     | **[実装区分: 実装仕様書]**（CONST_004 デフォルト・画面表示の変更が必須）             |
| taskType     | `implementation`                                                                    |
| visualEvidence | `VISUAL`（詳細ドロワー「送信日時」の表示テキスト変更）                            |
| implementation_mode | `new`                                                                        |
| status       | `unassigned`（未着手・実装未実施）                                                   |
| 分類         | 改善（UX 一貫性）                                                                    |
| 優先度       | low〜medium（実装コスト極小・機能破綻リスクなし）                                    |
| 見積もり規模 | 小規模（実質 1 行差し替え + 回帰テスト追加）                                         |
| relatedIssue | [#1208](https://github.com/daishiman/UBM-Hyogo/issues/1208)（本文サマリは §7 を流用） |
| 発見元       | `admin-members-timestamp-jst-and-identity-label-clarity`（直前完了タスク）の2回検証 |
| 発見日       | 2026-06-11                                                                           |
| スコープ     | `/(admin)/admin/members` の会員詳細ドロワー「送信日時」表示のみ                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

直前完了タスク `admin-members-timestamp-jst-and-identity-label-clarity`
（ブランチ `feat/admin-members-timestamp-jst-and-identity-label-clarity`）で、
会員管理画面の **一覧「最終更新」列** を秒精度の `formatJstDateTimeWithSeconds`
（例: `2026年6月9日 19:34:19`）に統一した。

しかし、同じ会員管理画面の **会員詳細ドロワー**
（`apps/web/src/features/admin/components/_members/MemberDrawer.tsx:208`）の「送信日時」項目は、
依然として分精度の `formatJstDateTime`（例: `2026/06/03 19:30`）のままである。

秒精度のヘルパー `formatJstDateTimeWithSeconds` は
`apps/web/src/lib/format/datetime.ts:37` に既に存在し、fail-soft 挙動も実装済みのため、
変更は実質「1 行の差し替え + 回帰テスト追加」で済む。

### 1.2 問題点・課題

- 同一画面内で **一覧では秒まで表示 → 詳細を開くと秒が消える** という書式の不整合がある。
- 「送信日時」と「最終更新」は運営者にとって近い意味（≒最終回答時刻）であり、
  桁数（精度）が画面ごとに異なると「別の時刻なのか」と誤読されうる。
- SSOT ヘルパー（`datetime.ts`）は秒精度版を持っているのに、呼び出し側で精度が揃っていない drift。

### 1.3 放置した場合の影響

- 運営者が一覧と詳細で同じ会員の時刻を見比べたときに、精度差で混乱する。
- 書式ポリシー（秒まで表示）が「一覧だけ適用済み・詳細は未適用」のまま固定化し、
  次に別の描画箇所（監査ログ等）を触る人が「どちらが正なのか」を再調査するコストを負う。

### 1.4 真因の層

**apps/web 表現層のみ**。API / D1 / Google Form は非変更（既存 endpoint surface 不変）。
`profile.lastSubmittedAt` の値そのものは正しく、表示変換の精度だけが一覧と不揃い。

---

## 2. 何を達成するか（What）

### 2.1 目的

会員詳細ドロワーの「送信日時」を、一覧「最終更新」列と同じ秒精度書式
（`formatJstDateTimeWithSeconds` / 例 `2026年6月9日 19:34:19`）に統一し、
会員管理画面における日時表記ポリシーを 1 つに揃える。

### 2.2 対象ファイル

| 区分 | パス | 変更内容 |
| ---- | ---- | -------- |
| 修正 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | `:208` の「送信日時」value を `formatJstDateTime` → `formatJstDateTimeWithSeconds` に差し替え。import 文（`:13`）も秒精度版へ更新（または併記）する |
| 修正/追加 | `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx` 等 | 「送信日時が秒付きで表示される」回帰テストを追加 |

> 注意: `MemberDrawer.tsx:306`（Recent Actions 風の `a.occurredAt`）と
> `RecentActionsTable.tsx` / `ReflectionTimingNote.tsx` も `formatJstDateTime`（分精度）を使うが、
> **本タスクのスコープ外**（§9 参照）。本タスクは「送信日時」項目1点のみ。

### 2.3 スコープ外（baseline）

§9 を正本とする。

---

## 3. 発見の経緯（2回検証で浮上した独立改善候補）

本未タスクは、元タスク `admin-members-timestamp-jst-and-identity-label-clarity` の
`shared-context.md` §9 で **OOS-1（スコープ外）** として一度判定されていた項目である。

元タスクでのスコープアウト理由（原文要約）:

> OOS-1: 詳細ドロワー「送信日時」の秒表示化。既に `formatJstDateTime` で
> `2026/06/03 19:30` と可読。ユーザー要求（最終更新列）の対象外。
> 一貫性目的で将来 `formatJstDateTimeWithSeconds` 統一は可能だが baseline 候補。

しかし元タスクの **AC-1（最終更新を秒まで表示）の精神** と
**ユーザー決定 Q1（書式 = 秒まで `2026年6月9日 19:34:19`）** に照らすと、
「同一画面の別描画箇所で書式が割れている」状態が残る。
この一貫性観点で、Phase 12 の **2回目の未タスク検証により独立改善候補として再浮上** した。
本仕様書はその formalize である。

---

## 4. Acceptance Criteria

| AC | 内容 | 検証方法 |
| -- | ---- | -------- |
| AC-1 | 会員詳細ドロワーの「送信日時」が `formatJstDateTimeWithSeconds` で秒まで表示される（例 `2026年6月9日 19:34:19`） | `MemberDrawer.identityLabels.spec.tsx` 等の回帰テスト + Playwright/手動 |
| AC-2 | fail-soft 維持: `lastSubmittedAt` が不正値/空のとき、既存ヘルパー挙動（元入力を返す）を維持し、`null`/`undefined` 時は従来どおり `—` を表示する | datetime.ts 既存 spec + ドロワー spec |
| AC-3 | `MemberDrawer.identityLabels.spec.tsx`（または同等の `_members/__tests__` spec）に「送信日時が秒付き」回帰テストを追加 | spec ファイル diff |
| AC-4 | `git diff --name-only -- apps/api` が空（API/D1/Form 非変更） | git diff |
| AC-5 | OKLch トークン正本のみ・HEX 直書き禁止を維持（`verify:tokens` 緑） | `pnpm verify:tokens` |

---

## 5. 既存コードの命名規則 / 現状確認（FB-01 対応）

| 対象 | 規則 / 現状 | 根拠 |
| ---- | ----------- | ---- |
| 秒精度ヘルパー | `formatJstDateTimeWithSeconds`（camelCase 動詞始まり・fail-soft 実装済み） | `apps/web/src/lib/format/datetime.ts:37` |
| 分精度ヘルパー | `formatJstDateTime`（既存・分まで・本タスクで「送信日時」のみ差し替え） | `apps/web/src/lib/format/datetime.ts:11` |
| 一覧での秒精度採用先例 | `MembersTable.tsx:163` が `formatJstDateTimeWithSeconds(m.lastSubmittedAt)` を採用済み | 元タスク実装 |
| テストファイル | `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止・不変条件 #8） | CLAUDE.md |
| トークン | OKLch `var(--ubm-color-*)` のみ（HEX 禁止・AC-5） | `tokens.css` |

> 命名ドリフトなし。既存 `formatJstDateTimeWithSeconds` をそのまま再利用するため、新規 helper/定数の追加は不要。

---

## 6. carry-over 確認

直近コミット: #1187（member 詳細 tag source 500 fail-soft / `MemberDrawer.tsx` を別箇所で編集）
/ #1181 / #1182 / #1180 / #1176。
`MemberDrawer.tsx` は #1187 で tag source 正規化のため触れられているが、対象は tag セクションであり
「送信日時」（フォーム回答 KVList）とは別箇所。コンフリクトリスク低。

---

## 7. Issue 本文に使えるサマリ

- **背景**: 直前タスクで一覧「最終更新」列を秒精度 `formatJstDateTimeWithSeconds`（`2026年6月9日 19:34:19`）に統一したが、
  会員詳細ドロワーの「送信日時」（`MemberDrawer.tsx:208`）は分精度 `formatJstDateTime`（`2026/06/03 19:30`）のまま残り、
  一覧で秒まで表示 → 詳細で秒なし、という同一画面内の書式不整合がある。真因は apps/web 表現層のみ。
- **スコープ**: `/(admin)/admin/members` の会員詳細ドロワー「送信日時」表示 1 点のみ。API/D1/Google Form 非変更。
  実質 1 行差し替え（既存ヘルパー再利用）+ 回帰テスト追加。
- **受入基準**: (1) 「送信日時」が `formatJstDateTimeWithSeconds` で秒まで表示 (2) fail-soft 維持（不正値は元入力・null/undefined は `—`）
  (3) `MemberDrawer.identityLabels.spec.tsx` 等に「秒付き表示」回帰テスト追加 (4) `apps/api` diff 空 (5) OKLch トークンのみ・HEX 禁止維持。
- **優先度**: low〜medium（UX 一貫性の改善・コスト極小・破綻リスクなし）。

---

## 8. 苦戦箇所 / 知見（CONST_004 必須記述）

| # | 知見 | 将来の解決策（簡潔粒度） |
| - | ---- | ------------------------ |
| K-1 | 日時フォーマットの秒精度統一は「一覧」だけでなく「詳細ドロワー」「監査ログ」など**複数描画箇所に分散**している。SSOT ヘルパー（`datetime.ts`）はあっても、呼び出し側で精度が揃わない drift が起きやすい | 書式ポリシー変更時は **横断 grep** で取りこぼしを洗い出す: `grep -rn "formatJstDateTime\b" apps/web/src` で分精度版の残存呼び出し箇所を全列挙し（本タスク時点で MemberDrawer 2 箇所 / RecentActionsTable / ReflectionTimingNote が該当）、スコープに含める箇所と OOS を明示的に切り分ける |
| K-2 | 元タスクでこの項目が baseline **OOS-1** としてスコープアウトされた判断理由は「既に可読」だったが、AC-1（秒まで表示）の精神とユーザー決定（Q1: 書式 = 秒まで）との一貫性観点で、2回目の未タスク検証により再浮上した | スコープアウト判定時は「**可読性**」だけを基準にせず、「**同一書式ポリシーの全描画箇所適用**」を基準に加える。可読だが書式が割れている箇所は「即 OK」ではなく「一貫性 baseline 候補」として明示記録する |

---

## 9. スコープ外（baseline・本タスク非対象）

| OOS | 内容 | 判断 |
| --- | ---- | ---- |
| OOS-1 | `MemberDrawer.tsx:306` の Recent Actions 風 `a.occurredAt`（分精度 `formatJstDateTime`）の秒化 | 同一ファイル内だが「送信日時」とは別項目。書式統一の対象だが、本タスクは「送信日時」に限定。横断統一は別タスク候補 |
| OOS-2 | `RecentActionsTable.tsx:44`（ダッシュボード最近の操作）の日時秒化 | 別画面・別コンポーネント。横断統一タスクで一括検討 |
| OOS-3 | `ReflectionTimingNote.tsx:21`（公開側「最終同期」表記）の日時秒化 | 公開側・性質が異なる（同期時刻の注記）。秒精度が UX 上必要かは別途判断 |

> OOS-1〜3 はいずれも独立改善であり、本タスク完了の阻害要因ではない（スコープ境界）。
> 横断的に全描画箇所を秒精度へ統一したい場合は、K-1 の grep 結果を起点とした別タスクを起票する。

---

## 10. Phase 構成（参考・本未タスクは Phase 1 を正本とする）

| Phase | 本未タスクでの扱い |
| ----- | ------------------ |
| 1 要件定義 | 本ファイルで確定（正本） |
| 2 設計 | import 差し替え + value 式変更の自明な1点設計。実装着手時に確定 |
| 3 設計レビュー | 着手時 |
| 4 テスト作成 | 「送信日時が秒付き」回帰テスト（AC-3） |
| 5 実装 | `MemberDrawer.tsx:208`（+ import）1 行差し替え |
| 6-10 | 回帰確認・QA・最終レビュー（実装着手時） |
| 11 手動テスト | VISUAL: ドロワー「送信日時」秒表示 screenshot |
| 12 ドキュメント | implementation guide / 未タスク検出 / skill feedback |
| 13 PR | user 明示承認後のみ |

> Phase 2 以降は実装担当タスクとして着手するときに具体化する。本未タスクの責務は
> 「真因・スコープ・AC・知見を固定し、後続実装が迷わない状態にする」ことに限る。
