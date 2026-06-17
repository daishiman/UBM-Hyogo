import { AdminSectionCard } from "../../features/admin/components/_shared";

export function IdentityConflictGuide() {
  return (
    <AdminSectionCard title="このページでできること" density="compact">
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-[var(--ubm-color-text-secondary)]">
        <li>同じ人が二重に登録されていそうな会員（氏名と職業が同じ）を自動で見つけます。</li>
        <li>「統合する」＝同じ1人としてまとめる操作です。登録内容は消えません。</li>
        <li>「別人として確定」＝本当に別の人だと記録し、今後候補に出さないようにします。</li>
      </ul>
    </AdminSectionCard>
  );
}
