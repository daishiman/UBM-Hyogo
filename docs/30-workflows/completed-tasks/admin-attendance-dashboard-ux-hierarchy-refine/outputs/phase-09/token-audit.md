# Phase 9 token-audit — AC-5 / AC-6 / AC-7 機械検証

> AC-5（OKLch トークン）/ AC-6（新規 primitive ゼロ）/ AC-7（apps/api・packages/shared diff ゼロ）を**具体コマンド付きで機械検証**する。期待結果を明示し、CI gate `verify-design-tokens` と対応づける。

## 1. AC-5: OKLch トークン監査（HEX 直書き / `bg-[#]` / `text-[#]` ゼロ）

### 1.1 grep コマンドと期待結果（0 件=PASS）

```bash
# (a) attendance feature 配下の HEX / 任意 utility ベタ書き
grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance \
  && echo "FAIL" || echo "PASS"

# (b) globals.css の attendance ブロック（.attendance-* 系）
grep -nE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/styles/globals.css \
  | grep -i "attendance" \
  && echo "FAIL(check)" || echo "PASS"
```

| 対象 | コマンド | 期待結果 |
| --- | --- | --- |
| attendance feature 全体 | (a) | マッチ 0 件 → `PASS` |
| globals.css attendance ブロック | (b) | attendance 文脈の HEX 0 件 → `PASS` |

> 注: (b) は `globals.css` 全体に HEX が存在しても attendance ブロックに無ければ本タスク的には PASS。確実を期すなら下記 §1.2 の gate（`verify:tokens`）を正本とする。grep は `grep` がマッチ 0 件で exit 1 を返すため `|| echo PASS` で判定する。

### 1.2 CI gate `verify-design-tokens` 対応

| 項目 | 内容 |
| --- | --- |
| ローカル実行 | `mise exec -- pnpm verify:tokens` |
| gate 本体 | `scripts/verify-design-tokens.ts`（`forbidden-color-literal` reason / `hexRe = /(^|[^A-Za-z0-9_-])(#[0-9A-Fa-f]{3}...)/g` 行 522 付近で HEX literal 検出） |
| CI workflow | `.github/workflows/verify-design-tokens.yml`（job `verify-design-tokens`：`pnpm vitest run scripts/verify-design-tokens.spec.ts` → `pnpm verify:tokens`） |
| 期待結果 | exit 0（`forbidden-color-literal` 検出 0 件） |

- gate は `tokens.css` / `globals.css` の token literal drift を検査する。本タスクで追加する `.attendance-*` クラスがすべて `var(--ubm-*)` 経由であれば PASS。

### 1.3 新規 CSS の `var(--ubm-*)` 経由チェックリスト

本タスクで追加・変更する全 CSS プロパティが下記トークン経由であることを確認する（HEX / 生数値の直書き禁止）:

- [ ] 色: `var(--ubm-color-*)`（`surface-bg` / `surface-panel` / `text-primary` / `text-secondary` / `text-muted` / `border-default` / `accent` / `success` / `warning` / `danger` / `info` / `zone-a..e` 等）— **HEX / `bg-[#]` / `text-[#]` ゼロ**
- [ ] 余白: `var(--ubm-space-*)`（4px grid: 0/1/2/3/4/6/8/12/16/24）— 生 px 直書き禁止
- [ ] 角丸: `var(--ubm-radius-*)`（sm/md/lg/xl/2xl）
- [ ] 影: `var(--ubm-shadow-*)`（xs/sm/md/lg）
- [ ] タイポ: `var(--ubm-text-*)`（hero は `--ubm-text-3xl`）— AC-1
- [ ] 要フォロー強調: `data-attendance-follow`（none/warn）セレクタが `var(--ubm-color-warning*)` / `var(--ubm-color-success*)` 経由（新規 token 追加なし）— AC-4

> 裏取り済み事実（_shared-context §10）: `Badge` tone は `default|accent|success|warning|danger|info`（`ok`/`warn` は**存在しない**）。要フォロー強調は `warning`、健全は `success` にマップする。

## 2. AC-6: 新規 primitive 追加ゼロの確認

```bash
# (a) components/ui/ への新規ファイル追加が無いことを確認
git diff --name-only --diff-filter=A | grep -E "^apps/web/src/components/" \
  && echo "FAIL(new primitive added)" || echo "PASS"

# (b) AttendanceDetailTabs が feature 層（primitive ではない）に置かれることを確認
ls apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx
test ! -e apps/web/src/components/ui/AttendanceDetailTabs.tsx && echo "PASS(feature 層)"
```

| 確認 | 期待結果 |
| --- | --- |
| (a) `apps/web/src/components/` 配下の新規追加 | 0 件 → `PASS` |
| (b) `AttendanceDetailTabs` の配置 | `features/admin/attendance/components/` のみに存在し `components/ui/` には無い → `PASS` |

> `AttendanceDetailTabs` は `Segmented`（既存 primitive）を内部利用する feature 層コンポーネント。`components/ui/` への新規 primitive 追加ではない（AC-6 充足）。

## 3. AC-7: apps/api・packages/shared diff ゼロの確認

```bash
# (a) 変更ファイル一覧に apps/api / packages/shared が含まれないこと
git diff --name-only HEAD | grep -E "^(apps/api/|packages/shared/)" \
  && echo "FAIL(API/shared changed)" || echo "PASS"

# (b) 未ステージ + ステージ済みの全変更を対象にする場合
git status --porcelain | grep -E "(apps/api/|packages/shared/)" \
  && echo "FAIL(API/shared changed)" || echo "PASS"
```

| 確認 | 期待結果 |
| --- | --- |
| (a) commit 済み diff | `apps/api/` / `packages/shared/` を含まない → `PASS` |
| (b) 作業ツリー全変更 | `apps/api/` / `packages/shared/` を含まない → `PASS` |

> AC-7 の根拠: 既存 API endpoint surface（overview / by-session / ranking / trend / zone-distribution / absentees）と `fetchAttendanceAnalyticsBundle` をそのまま利用し、D1 schema / Google Form schema / shared 型を変更しない（ui-prototype invariant #1）。変更は `apps/web` 表現層に閉じる。

## 4. 機械検証サマリ

| AC | 検証手段 | 期待結果 | 差し戻し先 |
| --- | --- | --- | --- |
| AC-5 | §1 grep + `verify:tokens` | HEX / `bg-[#]` / `text-[#]` 0 件・gate PASS | Phase 5/8 |
| AC-6 | §2 git diff（A）+ ls | `components/` 新規 0 件 | Phase 5 |
| AC-7 | §3 git diff / status | apps/api・packages/shared 0 件 | Phase 5 |
