"use client";

import { useEffect, useState } from "react";
import type { AnswerValue, MemberProfile } from "@ubm-hyogo/shared";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";

export interface MemberFieldEditorProps {
  readonly memberId: string;
  readonly profile: MemberProfile;
  readonly onProfileUpdated: (profile: MemberProfile) => void;
}

function fieldValueToText(value: AnswerValue): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function updateProfileField(
  profile: MemberProfile,
  stableKey: string,
  value: string,
): MemberProfile {
  return {
    ...profile,
    sections: profile.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        String(field.stableKey) === stableKey
          ? { ...field, value, source: "admin" as const }
          : field,
      ),
    })),
  };
}

export function MemberFieldEditor({
  memberId,
  profile,
  onProfileUpdated,
}: MemberFieldEditorProps) {
  const editableFields = profile.sections.flatMap((section) =>
    section.fields
      .filter((field) => field.kind !== "system" && field.kind !== "unknown")
      .map((field) => ({
        stableKey: String(field.stableKey),
        label: field.label || String(field.stableKey),
        value: fieldValueToText(field.value),
        source: field.source,
      })),
  );
  const [stableKey, setStableKey] = useState(editableFields[0]?.stableKey ?? "");
  const selected = editableFields.find((field) => field.stableKey === stableKey);
  const [value, setValue] = useState(selected?.value ?? "");

  useEffect(() => {
    setValue(selected?.value ?? "");
  }, [selected?.stableKey]);

  const mutation = useAdminMutation<{ ok: boolean }>(
    `/api/admin/member-fields/${encodeURIComponent(memberId)}`,
    "PUT",
    {
      successMessage: "✓ フィールドを保存しました",
      refreshOnSuccess: false,
      onSuccess: () => {
        onProfileUpdated(updateProfileField(profile, stableKey, value));
      },
    },
  );

  if (editableFields.length === 0) return null;

  return (
    <section
      aria-labelledby="drawer-field-override-heading"
      className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3"
    >
      <h3
        id="drawer-field-override-heading"
        className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]"
      >
        プロフィール確定編集
      </h3>
      <div className="mt-3 grid gap-2">
        <FormField name="member-field-stable-key" label="項目">
          <Select
            value={stableKey}
            onChange={(event) => setStableKey(event.currentTarget.value)}
          >
            {editableFields.map((field) => (
              <option key={field.stableKey} value={field.stableKey}>
                {field.label}
                {field.source === "admin" ? "（確定済）" : ""}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField name="member-field-value" label="値">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            rows={3}
            className="min-h-20 resize-y"
          />
        </FormField>
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            loading={mutation.isLoading}
            onClick={() => {
              mutation.trigger({ stableKey, value }).catch(() => undefined);
            }}
          >
            保存
          </Button>
        </div>
      </div>
    </section>
  );
}
