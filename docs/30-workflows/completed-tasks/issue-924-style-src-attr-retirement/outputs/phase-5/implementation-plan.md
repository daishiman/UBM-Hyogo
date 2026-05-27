# Phase 5: 実装計画 — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

> CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 入出力 / テスト方針 / ローカル実行コマンド / DoD）を本ファイルで満たす。

---

## 1. 変更対象ファイル一覧

### 1.1 production files (14) — `style={{...}}` 撤去

| Path | 区分 | 変更種別 | 概要 |
|------|-----|---------|------|
| `apps/web/app/global-error.tsx` | (A) 静的 | 修正 | 色 / spacing を Tailwind / token に置換 |
| `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` | (A) 静的 | 修正 | spacing / display を className 化 |
| `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx` | (A) 静的 | 修正 | 色 / spacing を Tailwind 化 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | (A) 静的 | 修正 | 同上 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | (A) 静的 | 修正 | 同上 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | (A) 静的 | 修正 | 同上 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | (A) 静的 | 修正 | 同上 |
| `apps/web/src/components/public/ZoneIntro.tsx` | (A) 静的 | 修正 | 同上 |
| `apps/web/src/components/public/Hero.tsx` | (A) 静的 | 修正 | gradient / background は `tokens.css` の bg utility に集約 |
| `apps/web/src/components/ui/Avatar.tsx` | (B) 動的 hue | 修正 | `data-hue="0..11"` + `Avatar.module.css` |
| `apps/web/src/components/ui/Icon.tsx` | (B) 動的 size | 修正 | `data-icon-size` + `Icon.module.css` |
| `apps/web/src/components/ui/ConfirmDialog.tsx` | (A) 静的 | 修正 | spacing / display を className 化 |
| `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | (A) 静的 | 修正 | 色 / border を token 化 |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | (C) 動的 percentage | 修正 | SVG `<rect>` に置換 |

### 1.2 smoke/harness files (3)

| Path | 変更種別 |
|------|---------|
| `apps/web/app/visual-harness/[name]/page.tsx` | 修正（同手法） |
| `apps/web/app/visual-harness/[name]/VisualScenarios.client.tsx` | 修正（同手法） |
| `apps/web/app/__smoke__/ui-primitives/page.tsx` | 修正（同手法） |

### 1.3 CSP builder

| Path | 変更種別 | 概要 |
|------|---------|------|
| `apps/web/src/lib/security-headers.ts` | 修正 | line 76 `["style-src-attr ", "'unsafe", "-inline'"].join("")` を削除 |

### 1.4 新規ファイル

| Path | 種別 | 概要 |
|------|-----|------|
| `apps/web/src/components/ui/avatar-hue.ts` | 新規 | `bucketHue(seed: string): 0..11` |
| `apps/web/src/components/ui/Avatar.module.css` | 新規 | `[data-hue="0..11"]` の 12 ルール |
| `apps/web/src/components/ui/Icon.module.css` | 新規 | `[data-icon-size="16|20|24|32|40"]` のルール |
| `scripts/verify-no-inline-style.sh` | 新規 | grep gate |
| `.github/workflows/verify-no-inline-style.yml` | 新規 | CI gate (or 既存 verify workflow に追加) |

### 1.5 テスト追加・更新

| Path | 変更種別 |
|------|---------|
| `apps/web/src/lib/__tests__/security-headers.spec.ts` | 更新（assertion 追加） |
| `apps/web/tests/security-headers.smoke.spec.ts` | 更新（assertion 追加） |
| `apps/web/src/components/ui/__tests__/Avatar.spec.tsx` | 新規 or 更新 |
| `apps/web/src/components/ui/__tests__/Icon.spec.tsx` | 新規 or 更新 |
| `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` | 新規 or 更新 |

### 1.6 設定

| Path | 変更種別 | 概要 |
|------|---------|------|
| `lefthook.yml` | 更新 | pre-push に `verify-no-inline-style` 追加 |

---

## 2. 関数・型シグネチャ（変わるもの）

### 2.1 `buildCspDirective`

呼び出し契約は不変。出力文字列から `style-src-attr 'unsafe-inline'` の 1 directive が消える。

```ts
function buildCspDirective(cfg: SecurityHeaderConfig): string  // unchanged signature
```

### 2.2 `bucketHue` (新規)

```ts
type HueBucket = 0|1|2|3|4|5|6|7|8|9|10|11;
export function bucketHue(seed: string): HueBucket;
```

副作用なし。pure function。

### 2.3 Avatar コンポーネント props

```ts
type AvatarProps = { seed: string; size?: number; alt?: string }; // unchanged
```

内部実装が `style` から `data-hue` + `className` に変わる。外部 API 不変。

### 2.4 Icon コンポーネント props

```ts
type IconProps = { size?: 16|20|24|32|40; children: ReactNode };  // size を union 型に厳格化
```

非標準値を渡している既存呼び出し箇所は Phase 5 実装時に最寄り標準値に丸める。

### 2.5 ZoneDistribution コンポーネント props

```ts
type ZoneSegment = { zone: string; percentage: number };
type ZoneDistributionProps = { data: ZoneSegment[] }; // unchanged
```

内部実装が `<div style={gradient}>` から `<svg>...<rect>` に変わる。外部 API 不変。

---

## 3. 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
|------|-----|------|--------|
| `buildCspDirective` | `SecurityHeaderConfig` | CSP string | なし（pure） |
| `bucketHue` | `seed: string` | `0..11` | なし（pure） |
| Avatar render | props | JSX | なし |
| Icon render | props | JSX | なし |
| ZoneDistribution render | props | JSX (SVG) | なし |
| `verify-no-inline-style.sh` | リポジトリ tree | exit 0/1 + stderr | 読取のみ |

---

## 4. 実装順序

1. **(C) `security-headers.ts`** の line 76 削除 + unit テスト追加（最小差分）。
2. **(C) Playwright smoke** に `style-src-attr` 不在 assert 追加。
3. **(B) Avatar / Icon / ZoneDistribution** の動的ケースを data-attr + CSS rule / SVG に置換。専用 module.css / `tokens.css` 追記。
4. **(B) 動的ケースの component テスト**追加。
5. **(A) 静的 14 ファイル**を Tailwind / token に置換（機械的）。
6. **smoke/harness 3 ファイル**を同手法で置換。
7. **grep gate**（`verify-no-inline-style.sh`）追加 + `lefthook.yml` + GitHub Actions workflow 配線。
8. visual regression を実行し pixel diff を確認。必要なら baseline 更新（VISUAL evidence 添付）。

---

## 5. ローカル実行コマンド

```bash
# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# focused unit
mise exec -- pnpm --filter @ubm-hyogo/web test

# Playwright smoke (security headers)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/security-headers.smoke.spec.ts

# visual regression (full 19 routes)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual --project=chromium

# grep gate
bash scripts/verify-no-inline-style.sh

# PR pre-flight
bash scripts/verify-pr-ready.sh
```

---

## 6. DoD（完了条件）

- [ ] `apps/web/src/lib/security-headers.ts:76` の `style-src-attr 'unsafe-inline'` 行が削除されている
- [ ] `apps/web/src` / `apps/web/app` 配下の `style={{` 件数が **0 件**（`scripts/verify-no-inline-style.sh` PASS）
- [ ] `security-headers.spec.ts` が `not.toContain('style-src-attr')` を含み green
- [ ] `tests/security-headers.smoke.spec.ts` が 4 routes 以上で `style-src-attr` 不在を assert し green
- [ ] Avatar / Icon / ZoneDistribution の component テストが green（inline style 不在を assert）
- [ ] 19 routes の visual baseline 退行が pixel-tolerance 内（必要なら baseline 更新済み + VISUAL evidence 添付）
- [ ] `lefthook.yml` の pre-push に grep gate が登録され、ローカル `git push` で fail 検出可能
- [ ] CI workflow に grep gate が登録され PR で fail 検出可能
- [ ] `mise exec -- pnpm typecheck && pnpm lint` PASS
- [ ] `bash scripts/verify-pr-ready.sh` PASS
- [ ] nonce 仕様（issue #871）不変条件が保たれている（`script-src` / `style-src` / `style-src-elem` 出力不変）
- [ ] commit / push / PR は user-gated（明示承認後）

---

## 7. ロールバック方針

- `security-headers.ts` の 1 行削除のみで CSP に `style-src-attr 'unsafe-inline'` を復活可能（revert 容易）。
- React コンポーネント側の `style={{...}}` 撤去は revert すれば inline style に戻るが、grep gate を一時 disable する必要がある。
- 段階的 rollback として、まず `security-headers.ts` の directive のみ復活させれば、属性 style を再許可する応急処置が可能。
