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

/** 1 member 1 photo（上書き保存）の object key。 */
export const MEMBER_PHOTO_OBJECT_KEY = (memberId: string): string =>
  `members/${memberId}/avatar`;

/** server 側で検証する上限サイズ（256 KB）。 */
export const MEMBER_PHOTO_MAX_BYTES = 256 * 1024; // 262144

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
