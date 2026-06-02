// GET /public/members/:memberId handler (04a)
// 不適格なら 404 (AC-4)、Cache-Control: no-store。

import { Hono } from "hono";

import { ctx } from "../../repository/_shared/db";
import {
  attendanceProviderMiddleware,
  type RepositoryProviderVariables,
} from "../../middleware/repository-providers";
import { getPublicMemberProfileUseCase } from "../../use-cases/public/get-public-member-profile";
import { getMemberPhoto } from "../../repository/memberPhotos";
import {
  MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  presignMemberPhotoGetUrl,
} from "../../lib/r2/member-photo-presign";

export interface MemberProfileEnv {
  DB: D1Database;
  // issue-1029: public member photo display 用の R2 presign 依存（admin と同一 secret 群）。
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  MEMBER_PHOTOS?: R2Bucket;
  ENVIRONMENT?: string;
}

export const memberProfileRoute = (
  app: Hono<{
    Bindings: MemberProfileEnv;
    Variables: RepositoryProviderVariables;
  }>,
): Hono<{
  Bindings: MemberProfileEnv;
  Variables: RepositoryProviderVariables;
}> => {
  app.use("/members/:memberId", attendanceProviderMiddleware);
  app.get("/members/:memberId", async (c) => {
    const memberId = c.req.param("memberId");
    const dbCtx = ctx({ DB: c.env.DB });
    const env = c.env;
    // issue-1029: 単一 member の presigned photoUrl resolver。use-case が公開 gate 通過後にのみ呼ぶ。
    // R2 secret 未設定 / bucket 未配線 / 写真未登録 / presign 失敗は fail-soft（photoUrl 省略・profile は 200 維持）。
    const resolvePhotoUrl = async (
      mid: string,
    ): Promise<string | undefined> => {
      if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
        return undefined;
      }
      const photo = await getMemberPhoto(dbCtx, mid as never);
      if (!photo) return undefined;
      const bucketName = env.MEMBER_PHOTOS
        ? env.ENVIRONMENT === "production"
          ? "ubm-hyogo-member-photos-prod"
          : "ubm-hyogo-member-photos-staging"
        : null;
      if (!bucketName) return undefined;
      const url = await presignMemberPhotoGetUrl(
        {
          accountId: env.R2_ACCOUNT_ID,
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
          bucket: bucketName,
        },
        photo.objectKey,
        MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
      );
      return url ?? undefined;
    };
    const result = await getPublicMemberProfileUseCase(memberId, {
      ctx: {
        ...dbCtx,
        var: { attendanceProvider: c.var.attendanceProvider },
      },
      resolvePhotoUrl,
    });
    c.header("Cache-Control", "no-store");
    return c.json(result, 200);
  });
  return app;
};
