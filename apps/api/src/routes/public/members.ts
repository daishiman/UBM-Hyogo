// GET /public/members handler (04a)
// Cache-Control: no-store (admin の publishState 変更を即時反映するため)

import { Hono } from "hono";

import { ctx } from "../../repository/_shared/db";
import { parsePublicMemberQuery } from "../../_shared/search-query-parser";
import { listPublicMembersUseCase } from "../../use-cases/public/list-public-members";
import { listMemberPhotosByIds } from "../../repository/memberPhotos";
import {
  MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  presignMemberPhotoGetUrl,
} from "../../lib/r2/member-photo-presign";

export interface MembersEnv {
  DB: D1Database;
  // issue-1029: public member photo display 用の R2 presign 依存（admin と同一 secret 群）。
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  MEMBER_PHOTOS?: R2Bucket;
  ENVIRONMENT?: string;
}

export const membersRoute = (
  app: Hono<{ Bindings: MembersEnv }>,
): Hono<{ Bindings: MembersEnv }> => {
  app.get("/members", async (c) => {
    const url = new URL(c.req.url);
    const raw: Record<string, string | string[]> = {};
    for (const key of url.searchParams.keys()) {
      const all = url.searchParams.getAll(key);
      raw[key] = all.length > 1 ? all : (all[0] ?? "");
    }
    const query = parsePublicMemberQuery(raw);
    const dbCtx = ctx({ DB: c.env.DB });
    const env = c.env;
    // issue-1029: 公開 gate 通過 member の object_key を 1 query batch 取得し presign する。
    // R2 secret 未設定 / bucket 未配線 / presign 失敗は fail-soft（photoUrl 省略・list は 200 維持）。
    const resolvePhotoUrls = async (
      memberIds: string[],
    ): Promise<Map<string, string>> => {
      const out = new Map<string, string>();
      if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
        return out;
      }
      if (memberIds.length === 0) return out;
      const bucketName = env.MEMBER_PHOTOS
        ? env.ENVIRONMENT === "production"
          ? "ubm-hyogo-member-photos-prod"
          : "ubm-hyogo-member-photos-staging"
        : null;
      if (!bucketName) return out;
      const keyMap = await listMemberPhotosByIds(dbCtx, memberIds);
      for (const [memberId, objectKey] of keyMap) {
        const url = await presignMemberPhotoGetUrl(
          {
            accountId: env.R2_ACCOUNT_ID,
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            bucket: bucketName,
          },
          objectKey,
          MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
        );
        if (url) out.set(memberId, url);
      }
      return out;
    };
    const result = await listPublicMembersUseCase(query, {
      ctx: dbCtx,
      resolvePhotoUrls,
    });
    c.header("Cache-Control", "no-store");
    return c.json(result, 200);
  });
  return app;
};
