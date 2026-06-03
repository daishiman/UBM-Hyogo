// issue-1030: member photo の client-side variant 生成（display / thumb）。
//
// 無料枠 invariant: サーバ/外部の有料画像処理（Cloudflare Images / Image Resizing）を使わず、
//   ブラウザの Canvas で display(≤512px webp) と thumb(96×96 cover webp) を生成する。
// invariant #5: R2 / D1 へは直接アクセスせず、生成した variant を multipart で API へ送るだけ。
//
// 純粋関数ガード（WEEKGRD-02）: SSR / Canvas 非対応 / 変換失敗のいずれでも例外を投げず、
//   原 File を display とする original_fallback を返す。入力 File は非破壊。

const WEBP_TYPE = "image/webp";
const WEBP_QUALITY = 0.82;
/** display variant の長辺上限（px）。 */
const DISPLAY_MAX_EDGE = 512;
/** thumb variant の 1 辺（px・cover crop）。 */
const THUMB_SIZE = 96;

export interface ResizedVariants {
  /** ≤512px 長辺 webp（変換不能時は原 File）。 */
  readonly display: File;
  /** 96×96 cover webp（生成失敗時 null）。 */
  readonly thumb: File | null;
  /** display bytes の sha-256 hex（算出不能時は空文字）。 */
  readonly contentHash: string;
  readonly status: "client_generated" | "original_fallback";
}

type DrawableCanvas = OffscreenCanvas | HTMLCanvasElement;

// `no-restricted-globals` を回避しつつ SSR / test stub 双方に対応するため、
// browser-only API は globalThis 経由で参照する。
interface CanvasGlobals {
  createImageBitmap?: (source: Blob) => Promise<ImageBitmap>;
  OffscreenCanvas?: typeof OffscreenCanvas;
  document?: Document;
  crypto?: Crypto;
}

const g = (): CanvasGlobals => globalThis as unknown as CanvasGlobals;

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += (bytes[i] ?? 0).toString(16).padStart(2, "0");
  }
  return out;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  try {
    const subtle = g().crypto?.subtle;
    if (!subtle) return "";
    const digest = await subtle.digest("SHA-256", bytes);
    return toHex(digest);
  } catch {
    return "";
  }
}

/**
 * Blob / File から sha-256 hex を算出する。bytes 読取 / digest いずれの失敗でも
 * 例外を投げず空文字を返す（hash は optional メタデータであり variant 生成を中断しない）。
 */
async function hashBlob(blob: Blob): Promise<string> {
  try {
    return await sha256Hex(await blob.arrayBuffer());
  } catch {
    return "";
  }
}

function createCanvas(width: number, height: number): DrawableCanvas | null {
  const { OffscreenCanvas: OC, document: doc } = g();
  if (typeof OC === "function") {
    try {
      return new OC(width, height);
    } catch {
      // fall through to HTMLCanvasElement
    }
  }
  if (doc && typeof doc.createElement === "function") {
    const canvas = doc.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return null;
}

async function canvasToWebp(canvas: DrawableCanvas): Promise<Blob | null> {
  const offscreen = canvas as OffscreenCanvas;
  if (typeof offscreen.convertToBlob === "function") {
    try {
      return await offscreen.convertToBlob({ type: WEBP_TYPE, quality: WEBP_QUALITY });
    } catch {
      return null;
    }
  }
  const html = canvas as HTMLCanvasElement;
  if (typeof html.toBlob === "function") {
    return await new Promise<Blob | null>((resolve) => {
      try {
        html.toBlob((blob) => resolve(blob), WEBP_TYPE, WEBP_QUALITY);
      } catch {
        resolve(null);
      }
    });
  }
  return null;
}

async function renderVariant(
  bitmap: ImageBitmap,
  targetW: number,
  targetH: number,
  mode: "fit" | "cover",
): Promise<Blob | null> {
  const canvas = createCanvas(targetW, targetH);
  if (!canvas) return null;
  const context = (canvas as HTMLCanvasElement).getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!context) return null;
  if (mode === "cover") {
    // cover: 短辺基準で拡大し中央 crop（96×96 に余白なく充填）。
    const scale = Math.max(targetW / bitmap.width, targetH / bitmap.height);
    const drawW = bitmap.width * scale;
    const drawH = bitmap.height * scale;
    context.drawImage(bitmap, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);
  } else {
    context.drawImage(bitmap, 0, 0, targetW, targetH);
  }
  return canvasToWebp(canvas);
}

function renameWebp(name: string, suffix = ""): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base || "photo"}${suffix}.webp`;
}

/**
 * 原 File から display / thumb variant を生成する。
 * いかなる失敗でも例外を投げず original_fallback（display = 原 File・thumb = null）を返す。
 */
export async function buildMemberPhotoVariants(file: File): Promise<ResizedVariants> {
  const fallback = async (): Promise<ResizedVariants> => ({
    display: file,
    thumb: null,
    contentHash: await hashBlob(file),
    status: "original_fallback",
  });

  const createBitmap = g().createImageBitmap;
  if (typeof createBitmap !== "function") return fallback();

  try {
    const bitmap = await createBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height) || 1;
    const scale = Math.min(1, DISPLAY_MAX_EDGE / longEdge);
    const displayW = Math.max(1, Math.round(bitmap.width * scale));
    const displayH = Math.max(1, Math.round(bitmap.height * scale));

    const displayBlob = await renderVariant(bitmap, displayW, displayH, "fit");
    if (!displayBlob) return fallback();

    const thumbBlob = await renderVariant(bitmap, THUMB_SIZE, THUMB_SIZE, "cover");

    // hash 失敗（bytes 読取不能 / crypto 不在）でも variant 生成は継続する。
    const contentHash = await hashBlob(displayBlob);
    const displayFile = new File([displayBlob], renameWebp(file.name), { type: WEBP_TYPE });
    const thumbFile = thumbBlob
      ? new File([thumbBlob], renameWebp(file.name, "-thumb"), { type: WEBP_TYPE })
      : null;

    return { display: displayFile, thumb: thumbFile, contentHash, status: "client_generated" };
  } catch {
    return fallback();
  }
}
