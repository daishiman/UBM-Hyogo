// issue-983: member photo の R2 SigV4 presigned GET URL 生成ユーティリティ。
//
// invariant #5: R2 アクセスは apps/api に閉じる。apps/web は presignedUrl を受け取って
//   <img src> に渡すだけで、R2 / D1 へ直接アクセスしない。
// AC-5: bucket は public list 禁止。GET は presigned URL（TTL 300s 既定）のみ。
//
// `aws4fetch` の AwsClient で R2 の S3 互換 endpoint に対し query 署名（signQuery）を行う。
import { AwsClient } from "aws4fetch";

export interface PresignDeps {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
}

/** 1 member 1 photo（上書き保存）の display(canonical) object key。 */
export const MEMBER_PHOTO_OBJECT_KEY = (memberId: string): string =>
  `members/${memberId}/avatar`;

/**
 * issue-1030: thumb variant の object key（display key と別 segment で 1 member 1 thumb）。
 * 既存 avatar key は display canonical として不変。
 */
export const MEMBER_PHOTO_THUMB_OBJECT_KEY = (memberId: string): string =>
  `members/${memberId}/thumb`;

/** server 側で検証する display 上限サイズ（256 KB）。 */
export const MEMBER_PHOTO_MAX_BYTES = 256 * 1024; // 262144

/** issue-1030: thumb variant の上限サイズ（64 KB）。client resize 後の切手サイズ webp を想定。 */
export const MEMBER_PHOTO_THUMB_MAX_BYTES = 64 * 1024; // 65536

/** issue-1030: variant 識別子（form field 名 / object key segment / 内部分岐で統一）。 */
export type MemberPhotoVariant = "display" | "thumb";

/**
 * issue-1030: client-side 画像処理の結果ステータス。
 * - client_generated: ブラウザ Canvas で display+thumb を生成して送信。
 * - original_fallback: Canvas 非対応等で原 File を display として送信（thumb なし）。
 * - none: 0023 以前の既存行（variant 列なし）の既定値。
 */
export type MemberPhotoProcessingStatus =
  | "client_generated"
  | "original_fallback"
  | "none";

/** 許可 MIME。これ以外は 415 を返す。 */
export const MEMBER_PHOTO_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** presigned GET URL の既定 TTL（秒）。 */
export const MEMBER_PHOTO_PRESIGN_TTL_SECONDS = 300;

/**
 * members/{memberId}/avatar の presigned GET URL（TTL 秒）を返す。
 * 失敗時（deps 不正 / objectKey 空 / ttl<=0 / aws4fetch throw）は null を返す（fail-soft）。
 * 呼び出し元が null チェックして photoUrl を省略すること。
 */
export async function presignMemberPhotoGetUrl(
  deps: PresignDeps,
  objectKey: string,
  ttlSeconds: number,
): Promise<string | null> {
  if (
    !deps.accountId ||
    !deps.accessKeyId ||
    !deps.secretAccessKey ||
    !deps.bucket ||
    !objectKey ||
    ttlSeconds <= 0
  ) {
    return null;
  }
  try {
    // object key はパス区切り `/` を保ったままエンコードする。
    const encodedKey = encodeURIComponent(objectKey).replace(/%2F/g, "/");
    const url = new URL(
      `https://${deps.accountId}.r2.cloudflarestorage.com/${deps.bucket}/${encodedKey}`,
    );
    // presigned URL の TTL は X-Amz-Expires クエリで指定する（aws4fetch は signQuery 時にこれを読む）。
    url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
    const aws = new AwsClient({
      accessKeyId: deps.accessKeyId,
      secretAccessKey: deps.secretAccessKey,
      service: "s3",
      region: "auto",
    });
    const signed = await aws.sign(new Request(url.toString(), { method: "GET" }), {
      aws: { signQuery: true },
    });
    return signed.url;
  } catch {
    // fail-soft: presign 失敗は null 返却。detail は 200 を維持する。
    return null;
  }
}
