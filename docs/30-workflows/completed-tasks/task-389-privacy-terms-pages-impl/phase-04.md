# Phase 4: テスト戦略 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

Privacy / Terms ページに対する unit test と HTTP smoke の検証戦略を定義する。

## レイヤ別戦略

### 1. Unit (semantic render + 必須セクション)

**追加ファイル**: `apps/web/app/{privacy,terms}/__tests__/page.test.tsx`

**テストケース**:

| ID | 名称 | 期待 |
| --- | --- | --- |
| UT-PRIV-1 | renders without throwing | コンポーネントが例外なく render |
| UT-PRIV-2 | contains required sections | `1. 取得する情報` `2. 利用目的` `3. 第三者提供` `4.` `5.` `6.` の見出しが全て存在 |
| UT-PRIV-3 | metadata.title is set | `metadata.title` が non-empty |
| UT-PRIV-4 | metadata.robots indexable | `metadata.robots.index === true` |
| UT-TERMS-1〜4 | terms 側の同等項目 | 上記と同様 |

**実装スケッチ**:
```ts
import { render, screen } from "@testing-library/react";
import PrivacyPage, { metadata } from "../page";

describe("PrivacyPage", () => {
  it("renders required sections", () => {
    render(<PrivacyPage />);
    for (const heading of ["取得する情報", "利用目的", "第三者提供", "管理", "開示", "改定"]) {
      expect(screen.getByText(new RegExp(heading))).toBeInTheDocument();
    }
  });
  it("has indexable metadata", () => {
    expect(metadata.title).toBeTruthy();
  });
});
```

### 2. HTTP smoke (Phase 11 で手動)

| Env | URL | 期待 |
| --- | --- | --- |
| staging | `https://<staging>/privacy` | 200 |
| staging | `https://<staging>/terms` | 200 |
| production | `https://<production>/privacy` | 200 |
| production | `https://<production>/terms` | 200 |

`curl -s -o /dev/null -w "%{http_code}\n" <URL>` を Phase 11 で実行し `manual-smoke-log.md` に記録。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- privacy terms
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web build
```

### 3. ビジュアル / consent screen

Phase 11 にて Google Cloud Console OAuth consent screen の Privacy URL / Terms URL 設定欄スクリーンショットを `outputs/phase-11/consent-screen-screenshot.png` に保存。

## 既存テストへの影響

- 影響なし（新規 test ファイルのみ追加）
- coverage への影響: `apps/web` Statements/Lines を微増（既存 baseline を下回らない）

## 完了条件

- [ ] テスト戦略が確定し対象ケース ID が固定されている
- [ ] HTTP smoke コマンドと evidence path が確定している
- [ ] `outputs/phase-04/main.md` を作成する

## 統合テスト連携

- 本タスクは D1/API 統合を持たないため、統合テストは HTTP smoke と Cloudflare Workers build readiness に集約する。
- `bash scripts/coverage-guard.sh` は App Router 静的 page を対象にしないため、semantic render test を coverage 例外の根拠とする。
