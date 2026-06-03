// @vitest-environment jsdom
// issue-1030 Phase 4/6: client-side variant 生成 util。
// jsdom に無い createImageBitmap / OffscreenCanvas / crypto.subtle は vi.stubGlobal で注入する。
import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { buildMemberPhotoVariants } from "../image-resize";

// jsdom の Blob/File は arrayBuffer() を実装していない（実ブラウザには存在する）。
// 実ブラウザ同等にするため FileReader 経由で polyfill する。
beforeAll(() => {
  const proto = Blob.prototype as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof proto.arrayBuffer !== "function") {
    proto.arrayBuffer = function (this: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    };
  }
});

interface FakeCanvasRecord {
  width: number;
  height: number;
}

const canvasLog: FakeCanvasRecord[] = [];

class FakeOffscreenCanvas {
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    canvasLog.push(this);
  }
  getContext() {
    return { drawImage: vi.fn() };
  }
  async convertToBlob() {
    return new Blob([new Uint8Array(8)], { type: "image/webp" });
  }
}

const stubBitmap = (width: number, height: number) =>
  vi.fn(async () => ({ width, height, close: vi.fn() }) as unknown as ImageBitmap);

const stubCryptoOk = () =>
  vi.stubGlobal("crypto", {
    subtle: { digest: vi.fn(async () => new Uint8Array(32).buffer) },
  });

const srcFile = () => new File([new Uint8Array(64)], "photo.jpg", { type: "image/jpeg" });

afterEach(() => {
  vi.unstubAllGlobals();
  canvasLog.length = 0;
});

describe("buildMemberPhotoVariants", () => {
  it("RESIZE-U-1: 全 API 成功 → client_generated・display/thumb webp・contentHash 64hex", async () => {
    vi.stubGlobal("createImageBitmap", stubBitmap(800, 600));
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
    stubCryptoOk();

    const result = await buildMemberPhotoVariants(srcFile());
    expect(result.status).toBe("client_generated");
    expect(result.display).toBeInstanceOf(File);
    expect(result.thumb).toBeInstanceOf(File);
    expect(result.display.type).toBe("image/webp");
    expect(result.thumb?.type).toBe("image/webp");
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("RESIZE-U-2: createImageBitmap throw → original_fallback・display は原 File・thumb null", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decode failed");
      }),
    );
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
    stubCryptoOk();

    const file = srcFile();
    const result = await buildMemberPhotoVariants(file);
    expect(result.status).toBe("original_fallback");
    expect(result.display).toBe(file);
    expect(result.thumb).toBeNull();
    // crypto は健全なので原 bytes の hash が出る。
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("RESIZE-U-3: convertToBlob が null → original_fallback・thumb null・例外なし", async () => {
    class NullBlobCanvas extends FakeOffscreenCanvas {
      async convertToBlob() {
        return null as unknown as Blob;
      }
    }
    vi.stubGlobal("createImageBitmap", stubBitmap(800, 600));
    vi.stubGlobal("OffscreenCanvas", NullBlobCanvas);
    stubCryptoOk();

    const file = srcFile();
    const result = await buildMemberPhotoVariants(file);
    expect(result.status).toBe("original_fallback");
    expect(result.display).toBe(file);
    expect(result.thumb).toBeNull();
  });

  it("RESIZE-U-4: SSR ガード（createImageBitmap 不在）→ original_fallback・display は原 File", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    vi.stubGlobal("OffscreenCanvas", undefined);

    const file = srcFile();
    const result = await buildMemberPhotoVariants(file);
    expect(result.status).toBe("original_fallback");
    expect(result.display).toBe(file);
    expect(result.thumb).toBeNull();
  });

  it("RESIZE-U-5: crypto.subtle 不在 → 例外なし・display は有効な File・hash は空 degrade", async () => {
    vi.stubGlobal("createImageBitmap", stubBitmap(800, 600));
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
    vi.stubGlobal("crypto", {}); // subtle 不在

    const result = await buildMemberPhotoVariants(srcFile());
    expect(result.display).toBeInstanceOf(File);
    expect(result.contentHash).toBe("");
    // 例外を投げないこと（ここまで到達すれば OK）。
  });

  it("RESIZE-U-6: 長辺 2000 の入力 → display canvas は長辺 512 以内・thumb は 96×96", async () => {
    vi.stubGlobal("createImageBitmap", stubBitmap(2000, 2000));
    vi.stubGlobal("OffscreenCanvas", FakeOffscreenCanvas);
    stubCryptoOk();

    await buildMemberPhotoVariants(srcFile());
    // 生成順: display(fit) → thumb(cover)
    const display = canvasLog[0]!;
    const thumb = canvasLog[1]!;
    expect(Math.max(display.width, display.height)).toBeLessThanOrEqual(512);
    expect(display.width).toBe(512);
    expect(display.height).toBe(512);
    expect(thumb.width).toBe(96);
    expect(thumb.height).toBe(96);
  });
});
