"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminSectionError,
  type AdminSectionErrorProps,
} from "./AdminSectionError";

export type AdminSectionErrorClientProps = Omit<
  AdminSectionErrorProps,
  "onRetry" | "isRetrying"
>;

export function AdminSectionErrorClient(props: AdminSectionErrorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <AdminSectionError
      {...props}
      isRetrying={isPending}
      onRetry={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    />
  );
}
