import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReflectionTimingNote } from "../ReflectionTimingNote";

afterEach(() => cleanup());

describe("ReflectionTimingNote", () => {
  it("members surface は最終同期と公開条件を表示する", () => {
    render(
      <ReflectionTimingNote
        surface="members"
        lastSyncAt="2026-05-31T00:00:00.000Z"
      />,
    );
    expect(screen.getByText(/最終同期:/).textContent).toContain("JST");
    expect(screen.getByText(/キャッシュ待ち/)).toBeTruthy();
    expect(screen.getByText(/公開同意 \+ 公開設定 \+ 未削除/)).toBeTruthy();
  });

  it("profile surface は公開状態に関係なく反映されることを表示する", () => {
    render(<ReflectionTimingNote surface="profile" lastSyncAt={null} />);
    expect(screen.getByText("最終同期: まだ同期されていません")).toBeTruthy();
    expect(screen.getByText(/公開状態に関係なく/)).toBeTruthy();
  });

  it("statsUnavailable の fallback を表示する", () => {
    render(
      <ReflectionTimingNote
        surface="members"
        lastSyncAt={null}
        statsUnavailable
      />,
    );
    expect(screen.getByText("最終同期時刻を取得できませんでした")).toBeTruthy();
  });

  it("members surface は反映目安に 15分/30秒/45分 を含む", () => {
    render(
      <ReflectionTimingNote surface="members" lastSyncAt="2026-05-31T00:00:00.000Z" />,
    );
    const text = screen.getByLabelText("Google Form 反映タイミング").textContent ?? "";
    expect(text).toContain("最大約 15 分");
    expect(text).toContain("最大 30 秒");
    expect(text).toContain("最大約 45 分");
  });

  it("profile surface はキャッシュ無し文言で 30 秒キャッシュ文言を含まない", () => {
    render(<ReflectionTimingNote surface="profile" lastSyncAt={null} />);
    const text = screen.getByLabelText("Google Form 反映タイミング").textContent ?? "";
    expect(text).toContain("キャッシュを使わない");
    expect(text).not.toContain("30 秒");
  });

  it("maxDelayMinutes の上書きが反映される", () => {
    render(
      <ReflectionTimingNote
        surface="members"
        lastSyncAt={null}
        maxDelayMinutes={20}
      />,
    );
    expect(screen.getByText(/最大約 20 分/)).toBeTruthy();
  });

  it("surface 別の data-testid を root に付与する", () => {
    const { rerender } = render(
      <ReflectionTimingNote surface="members" lastSyncAt={null} />,
    );
    expect(screen.getByTestId("reflection-timing-members")).toBeTruthy();
    rerender(<ReflectionTimingNote surface="profile" lastSyncAt={null} />);
    expect(screen.getByTestId("reflection-timing-profile")).toBeTruthy();
  });
});
