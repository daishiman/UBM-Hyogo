import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionCard } from "@/components/ui/layout";

export function AdminAccessNotice() {
  return (
    <SectionCard
      title="管理者メニュー"
      tone="accent"
      data-testid="profile-admin-access-notice"
      aria-label="管理者向けのご案内"
    >
      <p>
        管理者アカウントでログインしています。会員情報の管理・開催と出席の記録・公開状態の確認は管理画面から行えます。
      </p>
      <ButtonLink href="/admin" variant="secondary" size="md">
        管理画面を開く
      </ButtonLink>
    </SectionCard>
  );
}
