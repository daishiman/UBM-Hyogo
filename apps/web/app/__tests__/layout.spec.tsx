import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import RootLayout, { generateMetadata, viewport } from "../layout";

type RootElementProps = {
  lang: string;
  "data-theme": string;
  children: ReactElement<BodyElementProps>;
};

type BodyElementProps = {
  "data-shell": string;
  children: ReactNode;
};

describe("RootLayout", () => {
  it("exports generateMetadata and viewport", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBeDefined();
    expect(viewport).toEqual({
      width: "device-width",
      initialScale: 1,
      themeColor: "oklch(0.99 0.01 95)",
    });
  });

  it("sets ja + warm theme at html root and wraps children in ToastProvider", () => {
    const element = RootLayout({ children: <div data-testid="child" /> }) as ReactElement<RootElementProps>;
    expect(element.type).toBe("html");
    expect(element.props.lang).toBe("ja");
    expect(element.props["data-theme"]).toBe("warm");

    const body = element.props.children;
    expect(body.type).toBe("body");
    expect(body.props["data-shell"]).toBe("root");
  });
});
