**[実装区分: 実装仕様書]**

# Phase 5: 実装 / 11 件変更の順序立て実行

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 2 実装順序 / Phase 4 テスト計画 |
| 出力 | 本ファイル + 実装差分（実装フェーズで生成） |

## 1. 新規 / 修正 / 削除ファイル一覧表

| # | path | 区分 | 概要 |
|---|---|---|---|
| 1 | `apps/web/src/components/ui/brand-icons/google.svg` | 新規 | Google 公式 4-tone "G" SVG asset |
| 2 | `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` | 新規 | `google.svg` を render する React wrapper |
| 3 | `scripts/verify-design-tokens.ts` | 修正 | `DEFAULTS.brandIconExemptPaths` 追加 + filter 適用 |
| 4 | `scripts/verify-design-tokens.spec.ts` | 修正 | TC-EXEMPT-01〜04 を追加 |
| 5 | `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | 修正 | `<Icon name="google" />` を `<GoogleBrandIcon />` に差し替え |
| 6 | `apps/web/src/components/ui/icons.ts` | 修正 | `IconName` union から `"google"` 削除 |
| 7 | `apps/web/src/components/ui/Icon.tsx` | 修正 | `case "google":` を switch から削除 |
| 8 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | 修正 | 「brand-asset exempt path」章を追加 |
| 9 | `apps/web/playwright/tests/visual/login.spec.ts-snapshots/` | 修正（baseline 更新） | 4-tone 化に合わせて再生成 |
| 10 | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` | 修正 | FU-LOGIN-001 行を consumed 化、本 workflow path を back-reference |
| 11 | `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | 修正 | status を `pending` → `consumed`、canonical_workflow を本 workflow path に更新 |

## 2. 実装手順（Phase 2 の 9 ステップに対応）

### Step 1: SVG asset 入手と配置

1. Google Identity Guidelines の公式 4-tone "G" SVG（viewBox `0 0 48 48`、4 path: 青 `#4285F4` / 赤 `#EA4335` / 黄 `#FBBC05` / 緑 `#34A853`）を取得
2. `apps/web/src/components/ui/brand-icons/google.svg` に保存
3. 検証: `cat apps/web/src/components/ui/brand-icons/google.svg | grep -E '#4285F4|#EA4335|#FBBC05|#34A853'` で 4 色すべてが含まれることを確認

### Step 2: GoogleBrandIcon component 実装

ファイル: `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx`

```tsx
import googleG from "./google.svg";

type GoogleBrandIconProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_PX: Record<NonNullable<GoogleBrandIconProps["size"]>, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function GoogleBrandIcon({
  size = "md",
  className,
}: GoogleBrandIconProps) {
  const px = SIZE_PX[size];
  return (
    <img
      src={googleG}
      width={px}
      height={px}
      aria-hidden="true"
      alt=""
      draggable={false}
      className={className}
    />
  );
}
```

> HEX / path `d` 値は Step 1 の `google.svg` だけに置く。TSX へ手書きコピーしない。

### Step 3: verify-design-tokens 拡張

ファイル: `scripts/verify-design-tokens.ts`

1. `DEFAULTS` オブジェクトに追加:
   ```ts
   brandIconExemptPaths: [
     /\/components\/ui\/brand-icons\/[^/]+\.svg$/,
   ] as readonly RegExp[],
   ```
2. `scanForbiddenColorLiterals()` のファイル走査ループ内、`colorLiteralExcludes` 判定の直後に以下を挿入:
   ```ts
   const isBrandIconExempt = DEFAULTS.brandIconExemptPaths.some(rx => rx.test(filePath));
   if (isBrandIconExempt) continue;
   ```

### Step 4: verify-design-tokens.spec.ts への TC 追加（TDD Red 先行）

Phase 4 の TC-EXEMPT-01〜04 を Step 3 着手前に書き、Red であることを確認。Step 3 完了後に再実行して Green になることを確認。

### Step 5: GoogleOAuthButton 差し替え

ファイル: `apps/web/app/login/_components/GoogleOAuthButton.client.tsx`

- `import { Icon } from "@/components/ui/Icon";` を削除
- `import { GoogleBrandIcon } from "@/components/ui/brand-icons/GoogleBrandIcon";` を追加
- Button の `leftIcon={<Icon name="google" size="md" />}` を `leftIcon={<GoogleBrandIcon size="md" />}` に差し替え

### Step 6: legacy icon 撤去

1. `apps/web/src/components/ui/icons.ts` の `IconName` union から `| "google"` を削除
2. `apps/web/src/components/ui/Icon.tsx` の `iconGlyph(name)` switch から L113-121 の `case "google":` ブロックを削除
3. 検証: `grep -rn 'Icon name="google"' apps/web && grep -rn '"google"' apps/web/src/components/ui/icons.ts` が 0 件であることを確認

### Step 7: 09b-design-tokens.md に brand-asset exempt 章追加

ファイル: `docs/00-getting-started-manual/specs/09b-design-tokens.md`

追加する章:

```markdown
## brand-asset exempt path

外部 brand owner（Google / Apple / GitHub 等）が公式に指定するブランドアセットは、OKLch token システムの外側に配置し、`apps/web/src/components/ui/brand-icons/` 直下に置く。`scripts/verify-design-tokens.ts` の `DEFAULTS.brandIconExemptPaths` では **`.svg` ファイルのみ** HEX 直書きを許容する。

### 対象ディレクトリ

- `apps/web/src/components/ui/brand-icons/*.svg`
> subdirectory は exempt 対象外（直下のみ）

### 追加基準

- 外部 brand owner が公式に色値を指定している SVG アセット（Google Identity Guidelines 等）
- `*.tsx` component 内の HEX は不可。component は SVG asset を import/参照するだけにする
- プロジェクト独自の brand（UBM 兵庫支部会の brand-mark 等）は OKLch token 経由で管理し、本 exempt は使わない

### レビュー基準

- 新規追加時は本仕様書に owner / 出典 URL を併記する
- HEX 直書きは公式色のみ。透明度・派生色は OKLch token を使う
```

### Step 8: visual baseline 更新

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test visual/login --update-snapshots
```

更新後 `git diff --stat apps/web/playwright/tests/visual/login.spec.ts-snapshots/` で PNG 差分が記録されることを確認。

### Step 9: 親 workflow / unassigned spec の consumed 反映

1. `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-001 行に:
   - status を `consumed`
   - canonical_workflow に `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/` を追記
2. `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` の front matter:
   - `status: pending` → `status: consumed`
   - `canonical_workflow:` に本 workflow path を追記

## 3. 差分確認コマンド

Step 5-7 完了時に以下を実行:

```bash
grep -rn 'Icon name="google"' apps/web                       # 期待: 0 件
grep -n '"google"' apps/web/src/components/ui/icons.ts        # 期待: 0 件
grep -n 'case "google"' apps/web/src/components/ui/Icon.tsx   # 期待: 0 件
grep -rn '#4285F4' apps/web/src/components/ui/brand-icons     # 期待: 1+ 件
```

## 4. Phase 5 完了条件

- [x] 11 件変更ファイル一覧表を提示
- [x] 9 ステップの実装手順を詳細化
- [x] Red 先行 → Green 変換タイミングを明示
- [x] 差分確認コマンドを提示

## 5. 次 Phase への引き継ぎ

Phase 6 では Step 3-4 で追加した TC-EXEMPT-01〜04 に加えて、fail path（exempt 外で HEX を入れた場合の regression guard）を追加し、exempt 機構が抜け穴化していないことを保証する。
