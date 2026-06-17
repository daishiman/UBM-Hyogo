# Phase 9 token-audit — AC-5 / AC-6 / AC-7 + AC-1〜3 機械検証

> AC-5（OKLch トークン）/ AC-6（新規 primitive ゼロ）/ AC-7（apps/api・packages/shared diff ゼロ）/ AC-1〜AC-3（英語・専門語残存ゼロ）を**具体コマンド付きで機械検証**する。期待結果を明示し、CI gate `verify-design-tokens` と対応づける。文言日本語化タスクの中核ゲートは §4（英語・専門語残存ゼロ）にある。

## 1. AC-5: OKLch トークン監査（HEX 直書き / `bg-[#]` / `text-[#]` ゼロ + 新規 token ゼロ）

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

> 注: 本タスクは**文言置換が主体**で、CSS 変更は U-03 の軽微な `white-space`/`gap` 調整に限る。色プロパティの追加・変更はほぼ発生しないため HEX 0 件は容易に成立する。grep がマッチ 0 件で exit 1 を返すため `|| echo PASS` で判定する。

### 1.2 CI gate `verify-design-tokens` 対応

| 項目 | 内容 |
| --- | --- |
| ローカル実行 | `mise exec -- pnpm verify:tokens` |
| gate 本体 | `scripts/verify-design-tokens.ts`（`forbidden-color-literal` reason / `hexRe` で HEX literal 検出） |
| CI workflow | `.github/workflows/verify-design-tokens.yml`（job `verify-design-tokens`） |
| 期待結果 | exit 0（`forbidden-color-literal` 検出 0 件） |

### 1.3 新規 token ゼロの確認（本タスクは token を追加しない）

```bash
# tokens.css に新規 --ubm-* トークン追加が無いこと
git diff -- apps/web/src/styles/tokens.css | grep -E "^\+\s*--ubm-" \
  && echo "FAIL(新規 token 追加)" || echo "PASS"
```

| 確認 | 期待結果 |
| --- | --- |
| `tokens.css` への新規 `--ubm-*` 追加 | 0 件 → `PASS`（AC-5: 新規 token 追加ゼロ） |

### 1.4 新規 CSS の `var(--ubm-*)` 経由チェックリスト

U-03 で追加・変更する全 CSS プロパティが下記トークン経由であること（HEX / 生数値の直書き禁止）:

- [ ] 色: `var(--ubm-color-*)` — **HEX / `bg-[#]` / `text-[#]` ゼロ**
- [ ] 余白: `var(--ubm-space-*)`（4px grid）— 生 px 直書き禁止
- [ ] 角丸: `var(--ubm-radius-*)`
- [ ] 折返し制御: `white-space` / `overflow-wrap` 等は色を伴わないため token 不要だが、間隔は `var(--ubm-space-*)` 経由

## 2. AC-6: 新規 primitive 追加ゼロの確認

```bash
# (a) components/ui/（および components/ 全体）への新規ファイル追加が無いことを確認
git diff --name-only --diff-filter=A | grep -E "^apps/web/src/components/" \
  && echo "FAIL(new primitive added)" || echo "PASS"

# (b) attendance feature 配下への新規コンポーネント追加が無いことを確認（文言変更のみのため）
git diff --name-only --diff-filter=A | grep -E "^apps/web/src/features/admin/attendance/components/" \
  && echo "FAIL(new component added)" || echo "PASS"
```

| 確認 | 期待結果 |
| --- | --- |
| (a) `apps/web/src/components/` 配下の新規追加 | 0 件 → `PASS` |
| (b) attendance feature 配下の新規 component 追加 | 0 件 → `PASS`（既存 12 ファイルの文言変更のみ） |

> 本タスクは既存 component の表示文字列・aria-label 値・軽微 CSS のみ変更し、新規 component / primitive を一切作らない（AC-6 充足）。

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

> AC-7 の根拠: 既存 6 endpoint（overview / by-session / ranking / trend / zone-distribution / absentees）と `fetchAttendanceAnalyticsBundle` をそのまま利用し、D1 schema / Google Form schema / shared 型を変更しない（ui-prototype invariant #1）。変更は `apps/web` 表現層に閉じる。

## 4. AC-1 / AC-2 / AC-3: 英語・専門語残存ゼロ（本タスク中核ゲート）

### 4.1 grep コマンドと期待結果（画面表示・aria-label の Before 系ヒット 0 件=PASS）

```bash
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|3M|6M|1Y|CSVエクスポート|セッション|ユニーク|トレンド|区画|出席回数帯" \
  apps/web/src/features/admin/attendance \
  apps/web/app/\(admin\)/admin/dashboard/attendance \
  && echo "FAIL(残存あり)" || echo "PASS"
```

### 4.2 ヒット分類（画面表示・aria-label は 0 件、定数キーは許容）

| ヒット箇所の種類 | 扱い | 期待 |
| --- | --- | --- |
| 画面表示テキスト / aria-label 値 / コメント / テスト記述名 | AC-1/2/3 違反候補 | After 系のみ（Before 残骸 0 件） |
| 定数キー（`DETAIL_OPTIONS` / `PERIOD_PRESETS` 等）/ 型名 / testid | 不変で正 | 許容（変更しない） |

| AC | 対象語 | 期待結果 |
| --- | --- | --- |
| AC-1 | `PRIMARY` / `TREND` / `DETAIL` / `TOP10` / `TOP 10` / `ADMIN / DASHBOARD` / `3M` / `6M` / `1Y` / `CSV` | 画面表示・aria-label に 0 件 |
| AC-2 | `セッション` | 画面表示・aria-label・テスト名に 0 件 |
| AC-3 | `ユニーク` / `トレンド` / `区画` / `帯`（出席回数帯）/ `pt`（単位） | 画面表示・aria-label に 0 件 |

> `pt` は単独だと誤検出が多いため、`formatDelta` の戻り値（`↑1.2pt` 等）が `ポイント` に変わっていることを `format-attendance.spec.ts` の回帰テストで固定する（grep ではなくテストで担保）。

## 5. 機械検証サマリ

| AC | 検証手段 | 期待結果 | 差し戻し先 |
| --- | --- | --- | --- |
| AC-5 | §1 grep + `verify:tokens` + 新規 token ゼロ | HEX / `bg-[#]` / `text-[#]` 0 件・gate PASS・新規 token 0 | Phase 5/8 |
| AC-6 | §2 git diff（A） | `components/` 新規 0 件・attendance 新規 component 0 件 | Phase 5 |
| AC-7 | §3 git diff / status | apps/api・packages/shared 0 件 | Phase 5 |
| AC-1/2/3 | §4 grep + 分類 + 回帰テスト | 画面表示・aria-label の Before 系 0 件 | Phase 5/6 |
