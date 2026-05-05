import { SignOutButton } from "../auth/SignOutButton";

export function MemberHeader() {
  return (
    <header className="member-header" data-testid="member-header">
      <a href="/profile">マイページ</a>
      <SignOutButton />
    </header>
  );
}
