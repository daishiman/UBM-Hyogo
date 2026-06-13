---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 6
phase_name: テスト追加
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 6: テスト追加

## メタ情報

| キー | 値 |
|------|----|
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| 目的 | Phase 4 で計画したテスト 6 件（T-C1〜T-C3 / T-P1〜T-P3）の実装例コードを describe/it 単位で確定する |
| 対象 | `AdminAccessNotice.component.spec.tsx`（新規）/ `page.spec.tsx`（編集・新 describe 追加） |
| 環境 | jsdom（`@testing-library/react`・data 属性 / role / accessible name / テキストで検証） |
| wave 前提 | **implemented_local_evidence_captured（実装・local test 完了。staging/PR は user-gated）**。コードブロックは実装サイクルでそのまま使える粒度の実装例 |

---

## 目的

Phase 4 テスト計画を、既存 `page.spec.tsx` の mock 構造（`vi.hoisted` + `vi.mock` factory）に整合する実装例コードへ落とし、既存テストへの非干渉方針と実行コマンドを確定する。

## 実行タスク

1. `AdminAccessNotice.component.spec.tsx`（T-C1〜T-C3）の実装例コードを確定する。
2. `page.spec.tsx` への追加差分（mock 拡張 + fixture ヘルパー + 新 describe T-P1〜T-P3）を確定する。
3. 既存テストへの非干渉方針を確定する。
4. 実行コマンドを確定する。

---

## 1. `AdminAccessNotice.component.spec.tsx`（新規・T-C1〜T-C3）

`apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx` を新規作成する:

```tsx
// issue-1192: AdminAccessNotice component focused spec（T-C1〜T-C3）。
// 不変条件 #11 guard: props なし静的コンポーネントが member データを描画しないことを固定する。

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminAccessNotice } from "../AdminAccessNotice";

afterEach(() => cleanup());

describe("AdminAccessNotice (issue-1192)", () => {
  it("T-C1: 見出し「管理者メニュー」と案内本文が描画される", () => {
    render(<AdminAccessNotice />);

    expect(
      screen.getByRole("heading", { name: "管理者メニュー" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /管理者アカウントでログインしています。会員情報の管理・開催と出席の記録・\s*公開状態の確認は管理画面から行えます。/,
      ),
    ).toBeTruthy();
  });

  it("T-C2: accessible name「管理画面を開く」のリンクが /admin を指す", () => {
    render(<AdminAccessNotice />);

    const link = screen.getByRole("link", { name: "管理画面を開く" });
    expect(link.getAttribute("href")).toBe("/admin");
  });

  it("T-C3: testid 付き accent カードとして描画され、member データ風文字列を含まない（不変条件 #11）", () => {
    const { container } = render(<AdminAccessNotice />);

    const card = screen.getByTestId("profile-admin-access-notice");
    expect(card.getAttribute("data-component")).toBe("section-card");
    expect(card.getAttribute("data-tone")).toBe("accent");
    expect(card.getAttribute("aria-label")).toBe("管理者向けのご案内");

    // member データ風文字列（memberId 値パターン / email アットマーク）の非含有 guard
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/m_\d/);
    expect(text).not.toContain("@");
  });
});
```

> - T-C1 の本文マッチ: 実装（Phase 5 §2）は JSX 内で改行するため、テキストノード間の空白を許容する `\s*` 入り正規表現で照合する（jsdom はソース改行をそのまま textContent に残す）。
> - T-C2 の `getByRole("link")`: `ButtonLink` は `<a>` を出力する（`ButtonLink.tsx:29`）。`data-variant="secondary"` の検証は視覚契約側（既存 ButtonLink spec）が保有するため重複させない。
> - T-C3 は AC-5 の一次証跡。Phase 9 gate-(d)（grep）と二重防衛。

## 2. `page.spec.tsx` への追加（編集・T-P1〜T-P3）

### 2-1. mock 拡張（module top・additive のみ）

既存 `vi.mock("next/navigation", ...)` factory（`page.spec.tsx:37-46`）に **`useRouter` を追加**する（成功パス描画で mount される `PhotoUpload.client.tsx` 等が render 時に `useRouter()` を呼ぶため）:

```tsx
vi.mock("next/navigation", () => ({
  notFound: () => {
    notFound();
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (path: string) => {
    redirect(path);
    throw new Error("NEXT_REDIRECT");
  },
  // issue-1192: 成功パス描画で mount される client 子コンポーネント（PhotoUpload 等）用。
  useRouter: () => ({ refresh: vi.fn() }),
}));
```

既存 mock 群（`page.spec.tsx:48-52` の `vi.mock("@/lib/fetch/authed")`）の直後に `@/lib/api/public` の mock を追加する:

```tsx
// issue-1192: 成功パス描画（T-P1/T-P2）で page.tsx が呼ぶ getStats を mock する。
vi.mock("@/lib/api/public", () => ({
  getStats: vi.fn(),
}));
```

import 追加（既存 import 群へ）:

```tsx
import { getStats } from "@/lib/api/public";
import type { PublicStatsView } from "@/lib/api/public";
import type { MeProfileResponse, MeSessionResponse } from "@/lib/api/me-types";
import { asMemberId, asResponseId } from "@ubm-hyogo/shared";

const mockedGetStats = vi.mocked(getStats);
```

### 2-2. fixture ヘルパー（module scope・新 describe 直前に追加）

```tsx
// issue-1192: typecheck の通る最小 fixture（Phase 4 §4 fixture 設計）。
function buildMeSession(isAdmin: boolean): MeSessionResponse {
  return {
    user: {
      memberId: "m_1",
      responseId: "r_1",
      email: "member@example.com",
      isAdmin,
      authGateState: "active",
    },
    authGateState: "active",
  };
}

function buildMeProfileResponse(): MeProfileResponse {
  return {
    profile: {
      memberId: asMemberId("m_1"),
      responseId: asResponseId("r_1"),
      responseEmail: null,
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
      summary: {
        fullName: "テスト 太郎",
        nickname: "",
        location: "",
        occupation: "",
        ubmZone: null,
        ubmMembershipType: null,
      },
      sections: [],
      attendance: [],
      tags: [],
      lastSubmittedAt: "2026-06-01T00:00:00.000Z",
      editResponseUrl: null,
    },
    statusSummary: {
      publicConsent: "consented",
      rulesConsent: "consented",
      publishState: "public",
      isDeleted: false,
    },
    editResponseUrl: null,
    fallbackResponderUrl: "https://docs.google.com/forms/d/e/example/viewform",
    pendingRequests: {},
  };
}

function buildStatsResponse(): PublicStatsView {
  return {
    memberCount: 1,
    publicMemberCount: 1,
    zoneBreakdown: [],
    membershipBreakdown: [],
    meetingCountThisYear: 0,
    recentMeetings: [],
    lastSync: {
      schemaSync: "ok",
      responseSync: "ok",
      schemaSyncFinishedAt: null,
      responseSyncFinishedAt: "2026-06-01T00:00:00.000Z",
    },
    generatedAt: "2026-06-01T00:00:00.000Z",
  };
}
```

> branded 型（`MemberProfile.memberId: MemberId` 等）は `asMemberId` / `asResponseId`（`@ubm-hyogo/shared` root re-export・admin spec 群に使用実績あり）で解決する。`as any` は使わない（型不整合は V-1 typecheck で検出させる設計・Phase 4 リスク表）。

### 2-3. 新 describe（ファイル末尾に追加・T-P1〜T-P3）

```tsx
// issue-1192: 管理者補助導線（AdminAccessNotice）の page-level 分岐検証。
describe("ProfilePage admin access notice (issue-1192)", () => {
  beforeEach(() => {
    notFound.mockReset();
    redirect.mockReset();
    mockedFetchAuthed.mockReset();
    mockedGetStats.mockReset();
    mockedGetStats.mockResolvedValue(buildStatsResponse());
  });

  it("T-P1: isAdmin=true の成功パスで notice カードと /admin 導線が描画される", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce(buildMeSession(true))
      .mockResolvedValueOnce(buildMeProfileResponse());

    render(await ProfilePage());

    expect(redirect).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();

    const notice = screen.getByTestId("profile-admin-access-notice");
    expect(notice).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "管理画面を開く" }).getAttribute("href"),
    ).toBe("/admin");
  });

  it("T-P2: isAdmin=false の成功パスでは notice を描画しない（member 描画不変）", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce(buildMeSession(false))
      .mockResolvedValueOnce(buildMeProfileResponse());

    render(await ProfilePage());

    expect(screen.queryByTestId("profile-admin-access-notice")).toBeNull();
    // member 成功描画自体は不変（AC-3 / R-2）
    expect(screen.getByTestId("profile-authenticated-root")).toBeTruthy();
  });

  it("T-P3: isAdmin=true でも /me/profile 失敗の degrade 分岐では notice を描画しない", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce(buildMeSession(true))
      .mockRejectedValueOnce(new FetchAuthedError(503, "down"));

    render(await ProfilePage());

    expect(screen.getByRole("alert").textContent).toContain(
      "プロフィールを読み込めませんでした",
    );
    expect(screen.queryByTestId("profile-admin-access-notice")).toBeNull();
  });
});
```

> - `fetchAuthed` の mock 順序: 1 回目 = `/me`、2 回目 = `/me/profile`（`page.tsx:43-92` の呼び出し順・既存テストと同パターン）。`getStats` は別 module mock のため順序に関与しない。
> - T-P1 は「空 fixture（`sections: []` / `attendance: []` / `pendingRequests: {}`）で成功パス全子コンポーネントが例外なく mount できる」ことの確認を兼ねる（Phase 4 §4-4 実装時確認事項）。throw する子があれば fixture を最小限拡充する（assert は変えない）。

## 3. 既存テストへの非干渉方針

| 変更 | 既存テストへの影響 | 根拠 |
|------|------------------|------|
| `next/navigation` mock への `useRouter` 追加 | **なし**（additive な export 追加） | 既存 degrade テストは成功パスへ到達せず `useRouter` を呼ばない |
| `vi.mock("@/lib/api/public")` 追加 | **なし** | `statsResult` は成功パス（`page.tsx:154-161`）でのみ消費される。既存 degrade テストでは結果未使用（従来は実 `getStats` が safeServerFetch 内で fail していたが判定に不関与）。mock 化はネットワーク依存の除去であり判定を変えない |
| fixture ヘルパー / import 追加 | **なし** | module scope の追加のみ。既存 describe / beforeEach / assertion は 1 文字も変更しない |
| 新 describe 追加 | **なし** | ファイル末尾への追加。既存 describe（`ProfilePage safe fetch degrade` / shell 統合回帰 guard）は無修正で全件 GREEN を維持すること自体が AC-4 の判定 |

> **禁止事項**: 既存テストの期待値変更・skip 化・削除。1 件でも既存テストの修正が必要になった場合は AC-4 違反のシグナルであり、実装側（`page.tsx` の差分位置）を見直す。

## 4. 実行コマンド

```
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/(member)/profile/page.spec.tsx apps/web/app/(member)/profile/_components/__tests__/AdminAccessNotice.component.spec.tsx
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api packages
```

> focused Vitest（3 行目）が新規 6 件 + 既存 `page.spec.tsx` 全件 + `/profile` 配下既存 spec 群を一括実行する。期待: 全 GREEN・skip 0。local local 実装サイクルで実行済み済み。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| テスト計画 | `phase-4-test-plan.md` | テスト ID・入力・期待値・fixture 設計の正本 |
| 実装 | `phase-5-implementation.md` §2-3 | 被検証コード（`AdminAccessNotice` / `page.tsx` diff） |
| 既存 spec | `apps/web/app/(member)/profile/page.spec.tsx` | mock 構造（`vi.hoisted` / factory / `FetchAuthedError` / `mockedFetchAuthed`）の正本 |
| 型契約 | `apps/web/src/lib/api/me-types.ts` / `apps/web/src/lib/api/public.ts` / `packages/shared/src/types/viewmodel/index.ts` | fixture 型の整合元 |
| useRouter 必要性 | `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx:11,67` | mock 拡張の根拠 |

## 成果物

- `phase-6-test-additions.md`（T-C1〜T-C3 / T-P1〜T-P3 の実装例コード / mock 拡張差分 / 非干渉方針 / 実行コマンド）

## 統合テスト連携

本タスクは apps/web 表現層への極小追加であり、統合観点の検証は focused Vitest（`/profile` 配下・新規 6 件 + 既存回帰）と Phase 11 の視覚証跡計画で行う。apps/api との統合 contract は変更しない（AC-8・Phase 9 V-5 で機械保証）。本 Phase のテストは Phase 7 カバレッジ → Phase 9 QA へ連結する（AC trace: Phase 1 → 4 → 6 → 9/10 → 11）。

## 完了条件

- [x] 6 テスト（T-C1〜T-C3 / T-P1〜T-P3）の実装例コードが describe/it 単位で確定し、既存 `page.spec.tsx` の mock 構造に整合している。
- [x] mock 拡張（`useRouter` / `@/lib/api/public`）が additive であり、既存テストへの非干渉方針が根拠付きで明記されている。
- [x] fixture ヘルパーが実型（branded 含む）に整合し `as any` を使わない設計になっている。
- [x] 実行コマンド（検証コマンド正本）が記述されている。
