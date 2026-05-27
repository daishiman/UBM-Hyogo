import type { z } from "zod";

import { FormPreviewViewZ } from "@ubm-hyogo/shared";

export type FormPreviewView = z.infer<typeof FormPreviewViewZ>;
type Field = FormPreviewView["fields"][number];

export interface FormPreviewSectionsProps {
  preview: FormPreviewView;
}

const VISIBILITY_LABEL: Record<string, string> = {
  public: "公開",
  member: "会員のみ",
  admin: "管理者のみ",
};

export function FormPreviewSections({ preview }: FormPreviewSectionsProps) {
  // 不変条件 #1: stableKey 経由でのみ field を参照する。questionId は label / 内部参照に使用しない。
  const grouped = new Map<
    string,
    { sectionKey: string; sectionTitle: string; fields: Field[] }
  >();
  for (const f of preview.fields) {
    const existing = grouped.get(f.sectionKey);
    if (existing) {
      existing.fields.push(f);
    } else {
      grouped.set(f.sectionKey, {
        sectionKey: f.sectionKey,
        sectionTitle: f.sectionTitle,
        fields: [f],
      });
    }
  }

  return (
    <section data-component="form-preview-sections">
      <p>
        Google Form 構成を以下の {preview.sectionCount} セクションで把握できます。
      </p>
      {[...grouped.values()].map((section) => (
        <section key={section.sectionKey} data-section-key={section.sectionKey}>
          <h3>{section.sectionTitle}</h3>
          <ul>
            {section.fields.map((field) => (
              <li key={field.stableKey} data-stable-key={field.stableKey}>
                <span data-role="label">{field.label}</span>
                <span
                  data-role="visibility"
                  data-visibility={field.visibility}
                >
                  {VISIBILITY_LABEL[field.visibility] ?? field.visibility}
                </span>
                {field.required ? (
                  <span data-role="required">必須</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
