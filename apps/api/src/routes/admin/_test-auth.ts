import { asMemberId, signSessionJwt } from "@ubm-hyogo/shared";

export const TEST_AUTH_SECRET = "test-secret-test-secret-test-secret-test-secret";

export const adminAuthHeader = async (): Promise<{ Authorization: string }> => ({
  Authorization: `Bearer ${await signSessionJwt(TEST_AUTH_SECRET, {
    memberId: asMemberId("m_admin"),
    email: "admin@example.com",
    isAdmin: true,
  })}`,
});
