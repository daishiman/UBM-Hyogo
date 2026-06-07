# Phase 12 — 実装ガイド

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本ガイドは 2 部構成です。Part 1 は専門用語を使わず、中学生でも分かる例え話で「なぜ」と「何を」を説明します。
Part 2 はエンジニア向けに、型・閾値・属性・スタイル・検証コマンドを正確に記述します。

---

## Part 1 — やさしい説明（例え話つき）

### たとえ話：信号機で会の出席をひと目で見分ける

学校の掲示板に、これまで開かれた集まりの一覧が貼ってあるところを想像してください。
それぞれの集まりの横には「何人来たか」を書いた小さな札（ふだ）がぶら下がっています。

いまの掲示板は、その札が**ぜんぶ同じ色**です。だから一覧をパッと見ても、

- たくさん人が集まった大盛況の回
- 数人だけの小さな回
- まだ誰も出席を記録していない（人数ゼロの）回

の区別がつきません。一枚一枚の数字をちゃんと読まないといけないので、目が疲れますし時間もかかります。

そこで、この札を**信号機のように色分け**します。

- **記録がまだない回（0 人）** … 目立たないグレー。「ここはまだ空っぽですよ」という合図。
- **ふつうの回（1〜9 人）** … おだやかな色。「ふつうに開けました」という合図。
- **たくさん来た回（10 人以上）** … はっきりした緑。「大盛況です！」という合図。

こうすると、運営する人は札の色を見るだけで「あ、この回はたくさん来たな」「ここは記録がまだだな」と
**数字を読まなくても一瞬で**わかるようになります。横断歩道の信号を見て、数字を読まずに「進め・止まれ」が
分かるのと同じ仕組みです。

### 何をするのか

1. 「人数 → どのレベル（none / normal / high）か」を決める**小さな判定係**を 1 つ作ります。
   この判定係は「10 人以上なら high」というルールを、たった 1 か所にだけ書きます。あとで「やっぱり 15 人からにしよう」と
   思ったら、その 1 か所の数字を変えるだけで済みます。ルールがあちこちに散らばらないので、間違いが起きにくくなります。
2. 札（バッジ）に、いま何レベルかを表す**目印（ラベル）**をこっそり貼ります。見た目の文字や数字はそのまま変えません。
3. その目印を見て**色を塗り分ける**ルールを、見た目を決めるファイル（スタイル）に書きます。色は新しく作らず、
   このサイトがもともと持っている「公式の色セット」から選びます。勝手に新しい色を増やしません。
4. 「0 人ならグレー、5 人ならおだやか、12 人なら緑になっているか」を確かめる**自動チェック**を足します。

これだけです。集計の中身（実際に何人来たか）の計算は**いっさい触りません**。札の色を変えるだけです。

---

## Part 2 — 技術仕様

### 2.1 追加する TypeScript インターフェース

`apps/web/src/features/admin/components/_meetings/meetingStats.ts` に以下を追加（export 追加のみ・既存 export 不変）。

```ts
export const ATTENDANCE_LEVEL_THRESHOLDS = { high: 10 } as const;

export type AttendanceLevel = "none" | "normal" | "high";

export function attendanceLevel(count: number): AttendanceLevel {
  if (!Number.isFinite(count) || count <= 0) return "none";
  if (count >= ATTENDANCE_LEVEL_THRESHOLDS.high) return "high";
  return "normal";
}
```

- シグネチャ: `attendanceLevel(count: number): AttendanceLevel`
- 純関数（副作用なし・I/O なし）。`computeMeetingStats` と同 module に同居させる。
- 識別子は SSOT と完全一致（`ATTENDANCE_LEVEL_THRESHOLDS` / `AttendanceLevel` / `attendanceLevel`）。drift 禁止。

### 2.2 閾値マッピング表

| level | 条件 | 意味 | 由来 |
| --- | --- | --- | --- |
| `none` | `!Number.isFinite(count) || count <= 0`（NaN / 負数 / 0 を含む） | 未登録（記録なし） | 0 名・不正値を最初に排除 |
| `normal` | `1 <= count <= 9`（= `none` でも `high` でもない） | 通常開催 | デフォルト分岐 |
| `high` | `count >= ATTENDANCE_LEVEL_THRESHOLDS.high`（= `>= 10`） | 多数出席（強調） | `ATTENDANCE_LEVEL_THRESHOLDS.high = 10` |

判定順序は **`none` → `high` → `normal`** の順で評価する（不正値ガードを先頭に置くことで、NaN が `>= 10` 比較へ
漏れて誤分類されるのを防ぐ）。

### 2.3 `data-attendance-level` 属性

`apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` のバッジ span（現状 57 行）に属性を付与する。

```tsx
<span
  className="ui-badge"
  data-testid={...}            // 既存・不変
  data-attendance-level={attendanceLevel(attendanceCount)}   // 追加
>
  {attendanceLabel}
</span>
```

- `className="ui-badge"` / `data-testid` / `{attendanceLabel}`（表示テキスト）は**一切変更しない**。
- `attendanceCount` は既存（現状 34 行で算出済み）の値をそのまま渡す。集計ロジックは触らない。
- 付与する属性値は `"none" | "normal" | "high"` のいずれか（`attendanceLevel` の戻り値そのもの）。

### 2.4 `globals.css` の scoped セレクタとトークン採用表

`apps/web/src/styles/globals.css` の `@layer components` に追加。`.admin-timeline__heading` でスコープし、
共有 `.ui-badge`（`Badge.tsx` 経由含む）の既定挙動へ波及させない。

| セレクタ | 背景 | 文字色 |
| --- | --- | --- |
| `.admin-timeline__heading .ui-badge[data-attendance-level]`（基底） | （各レベルで上書き） | （各レベルで上書き） |
| `.admin-timeline__heading .ui-badge[data-attendance-level="none"]` | `var(--status-neutral-bg)` | `var(--ubm-color-text-secondary)` |
| `.admin-timeline__heading .ui-badge[data-attendance-level="normal"]` | `var(--ubm-color-accent-soft)` | `var(--ubm-color-accent-ink)` |
| `.admin-timeline__heading .ui-badge[data-attendance-level="high"]` | `var(--status-success-bg)` | `var(--ubm-color-ok)` |

- 全トークンは `apps/web/src/styles/tokens.css` に既存。新規トークン追加なし。
- `high` の文字色も既存 `var(--ubm-color-ok)` を使用し、実装・Phase 2/5/8/9 の token 採用と一致させる。
- `.admin-timeline__heading` scope により共有 `.ui-badge` には波及しない（invariant #3：新規 primitive を生やさない）。

### 2.5 エッジケース

| 入力 | 期待 level | 理由 |
| --- | --- | --- |
| `0` | `none` | `count <= 0` |
| `-3`（負数） | `none` | `count <= 0`（負数も未登録扱いに丸める） |
| `NaN` | `none` | `!Number.isFinite(count)` を先頭ガードで捕捉 |
| `1` | `normal` | `none` でも `high` でもない最小値 |
| `9` | `normal` | `high` 閾値直下 |
| `10`（ちょうど閾値） | `high` | `count >= 10`（境界は high 側に含む） |
| `25` | `high` | `>= 10` |

### 2.6 設定可能パラメータ

| パラメータ | 既定値 | 調整方法 |
| --- | --- | --- |
| `ATTENDANCE_LEVEL_THRESHOLDS.high` | `10` | この 1 定数を変えるだけで `high` 判定の境界を調整できる（単一 tuning point） |

将来 `normal` をさらに分割する場合も、まず本定数にキーを追加する設計（恣意的な数値直書きを禁止）。

### 2.7 検証コマンド（後続・実行は user-gated）

リポジトリルートから実行する。本タスクは以下 2 ファイルを targeted run する。

```bash
# targeted vitest（2 ファイルのみ）
mise exec -- pnpm vitest run \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts

# 型チェック / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# HEX 直書きが無いことの grep（追加行に対して）
rg -n "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/styles/globals.css

# design token gate
mise exec -- pnpm verify:design-tokens   # または CI gate verify-design-tokens
```

期待: vitest green（0/5/12 名 = none/normal/high、境界 0/1/9/10/25/-3/NaN）、typecheck 0、lint 0、
HEX 検出 0、`verify-design-tokens` PASS。

## 視覚証跡

本タスクは **VISUAL_ON_EXECUTION** のため、local Playwright fixture で実ブラウザ screenshot 3 点を取得済み。staging runtime での追加取得は user-gated。

| 証跡 | ファイル | 状態 |
| --- | --- | --- |
| 出席レベル none のバッジ | `outputs/phase-11/screenshots/attendance-badge-level-none.png` | present |
| 出席レベル normal のバッジ | `outputs/phase-11/screenshots/attendance-badge-level-normal.png` | present |
| 出席レベル high のバッジ | `outputs/phase-11/screenshots/attendance-badge-level-high.png` | present |

撮影計画と撮影メタは以下を参照（spec-only として既に整備）。

- `outputs/phase-11/screenshot-plan.json`
- `outputs/phase-11/phase11-capture-metadata.json`
- `outputs/phase-11/ui-sanity-visual-review.md`
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/screenshot-inventory.json`

staging screenshot の追加取得・添付は Phase 13（user 承認後）に行う。
