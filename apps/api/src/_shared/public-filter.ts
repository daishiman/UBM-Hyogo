// 公開フィルタ (04a)
// 不変条件 #2 (consent キー = publicConsent) / #11 (admin-managed 分離)
// 公開条件: public_consent='consented' AND publish_state='public' AND is_deleted=0
// 1 箇所に集約することで where 条件の漏れ・取り違えを防ぐ。

export interface PublicWhereParams {
  readonly publicConsent: "consented";
  readonly publishState: "public";
  readonly isDeleted: 0;
}

export const buildPublicWhereParams = (): PublicWhereParams => ({
  publicConsent: "consented",
  publishState: "public",
  isDeleted: 0,
});

export interface MemberStatusView {
  readonly publicConsent: string;
  readonly publishState: string;
  readonly isDeleted: boolean;
}

export const isPublicStatus = (s: MemberStatusView): boolean =>
  s.publicConsent === "consented" &&
  s.publishState === "public" &&
  s.isDeleted === false;
