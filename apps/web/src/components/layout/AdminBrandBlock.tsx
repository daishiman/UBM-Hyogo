import Link from "next/link";

export function AdminBrandBlock() {
  return (
    <Link
      href="/"
      aria-label="ホームに戻る"
      data-component="admin-brand-block"
      className="mb-4 flex items-center gap-2 rounded-sm px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
    >
      <span
        data-component="admin-brand-mark"
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--ubm-color-border-default)] text-sm font-bold text-[var(--ubm-color-accent)]"
      >
        U
      </span>
      <span className="flex flex-col leading-tight">
        <span
          data-component="admin-brand-title"
          className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
        >
          UBM兵庫
        </span>
        <span
          data-component="admin-brand-subtitle"
          className="text-xs text-[var(--ubm-color-text-secondary)]"
        >
          管理コンソール
        </span>
      </span>
    </Link>
  );
}
