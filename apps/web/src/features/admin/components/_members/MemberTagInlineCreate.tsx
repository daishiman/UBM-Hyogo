// issue-1068 / task-B: drawer 内 tag inline-create の子 component。
//   状態機械 createPhase（idle → form → submitting → idle/conflict）を所有し、
//   create（POST /admin/tags = master write）だけを担う。member への付与（attach）は
//   親 MemberTagsEditor の既存 assign mutation に委譲する（責務分離・付与経路を一本化）。
//   不変条件: mutation は useAdminMutation 経由（#10）/ input は FormField 経由（#9）/
//             色は OKLch token のみ（#2）/ API バックエンド変更なし（#7）。
"use client";
import { useState } from "react";
import { FormField } from "../../../../components/ui/FormField";
import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import { FetchAuthedError, useAdminMutation } from "../../hooks/useAdminMutation";
import { parseTagErrorCode, type AdminTagRef } from "../../api/members";
import { TagPill } from "../_shared/TagPill";

type CreatePhase = "idle" | "form" | "submitting" | "conflict";

interface FieldErrors {
  code?: string;
  label?: string;
  category?: string;
}

export interface MemberTagInlineCreateProps {
  /** 親が所有する available（conflict 時に同 code の既存 tag を提示するため）。 */
  readonly available: AdminTagRef[];
  /** create 201 後に呼ぶ。親は available へ追加し assign mutation で attach する。 */
  readonly onTagCreated: (tag: AdminTagRef) => void;
  /** 409 conflict 時に呼ぶ。親は member tags を refetch して available を更新する。 */
  readonly onConflict: (code: string) => void;
  /** conflict 解消で既存 tag を選択したとき呼ぶ。親は assign mutation で attach する。 */
  readonly onSelectExisting: (tag: AdminTagRef) => void;
  /** 親 attach 進行中ロック（既存 tag 選択ボタンの二重発火防止）。 */
  readonly pending?: boolean;
}

const CODE_RE = /^[a-z0-9][a-z0-9_]*$/;

/** 送信前 client validation（server 規則と同一: code 1-64 + regex、label 1-120、category 1-64）。 */
export function validateTagFields(input: {
  code: string;
  label: string;
  category: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const code = input.code.trim();
  const label = input.label.trim();
  const category = input.category.trim();

  if (!code) errors.code = "コードを入力してください";
  else if (code.length > 64) errors.code = "コードは64文字以内で入力してください";
  else if (!CODE_RE.test(code))
    errors.code = "コードは英小文字・数字・アンダースコアのみ（先頭は英数字）で入力してください";

  if (!label) errors.label = "表示名を入力してください";
  else if (label.length > 120) errors.label = "表示名は120文字以内で入力してください";

  if (!category) errors.category = "カテゴリを入力してください";
  else if (category.length > 64) errors.category = "カテゴリは64文字以内で入力してください";

  return errors;
}

const hasErrors = (e: FieldErrors): boolean =>
  Boolean(e.code || e.label || e.category);

export function MemberTagInlineCreate({
  available,
  onTagCreated,
  onConflict,
  onSelectExisting,
  pending = false,
}: MemberTagInlineCreateProps) {
  const [createPhase, setCreatePhase] = useState<CreatePhase>("idle");
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // server 400 等の包括フォールバック error（form 上部に表示）。
  const [formError, setFormError] = useState<string | null>(null);
  // 直前に送信した code（conflict 時に available から既存 tag を引くため）。
  const [conflictCode, setConflictCode] = useState<string>("");

  const create = useAdminMutation<AdminTagRef>("/api/admin/tags", "POST", {
    refreshOnSuccess: false,
    successMessage: "✓ タグを作成しました",
  });

  const resetForm = (): void => {
    setCode("");
    setLabel("");
    setCategory("");
    setFieldErrors({});
    setFormError(null);
  };

  const openForm = (): void => {
    resetForm();
    setCreatePhase("form");
  };

  const cancel = (): void => {
    resetForm();
    setConflictCode("");
    setCreatePhase("idle");
  };

  const backToForm = (): void => {
    setFormError(null);
    setCreatePhase("form");
  };

  const submit = async (): Promise<void> => {
    const trimmed = {
      code: code.trim(),
      label: label.trim(),
      category: category.trim(),
    };
    const errors = validateTagFields(trimmed);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return; // client validation NG → create mutation を発火しない
    }
    setFieldErrors({});
    setFormError(null);
    setCreatePhase("submitting");
    try {
      const created = await create.trigger(trimmed);
      // 201: 付与は親に委譲し、自身は idle へ復帰（fields クリア）。
      resetForm();
      setCreatePhase("idle");
      onTagCreated(created);
    } catch (err: unknown) {
      const bodyText =
        err instanceof FetchAuthedError
          ? err.bodyText
          : ((err as { bodyText?: string } | null)?.bodyText ?? "");
      const errCode = parseTagErrorCode(bodyText);
      if (errCode === "tag_code_conflict") {
        // 409: 重複再送信せず conflict へ。親へ refetch を要求。
        setConflictCode(trimmed.code);
        setCreatePhase("conflict");
        onConflict(trimmed.code);
      } else {
        // 400 (invalid_body / invalid_json) / network / その他 → 包括 error で form へ復帰。
        setFormError(
          errCode === "invalid_body" || errCode === "invalid_json"
            ? "入力内容を確認してください（コード/表示名/カテゴリの形式が不正です）"
            : "タグの作成に失敗しました。時間をおいて再度お試しください",
        );
        setCreatePhase("form");
      }
    }
  };

  if (createPhase === "idle") {
    return (
      <div className="mt-3 border-t border-[var(--ubm-color-border-default)] pt-3">
        <Button
          type="button"
          variant="soft"
          size="sm"
          onClick={openForm}
          data-testid="tag-inline-create-open"
        >
          + 新規タグ
        </Button>
      </div>
    );
  }

  if (createPhase === "conflict") {
    const existing = available.find((t) => t.code === conflictCode);
    return (
      <div
        className="mt-3 flex flex-col gap-2 border-t border-[var(--ubm-color-border-default)] pt-3"
        data-testid="tag-inline-create-conflict"
      >
        <p role="alert" className="text-sm text-[var(--ubm-color-text-secondary)]">
          「{conflictCode}」は既に存在します。既存のタグを選択して付与できます。
        </p>
        {existing ? (
          <div className="flex flex-wrap gap-2">
            <TagPill
              disabled={pending}
              onClick={() => {
                onSelectExisting(existing);
                cancel();
              }}
            >
              {existing.label}
            </TagPill>
          </div>
        ) : (
          <p className="text-xs text-[var(--ubm-color-text-muted)]">
            既存タグを読み込んでいます…
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={backToForm}>
            入力を修正
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            閉じる
          </Button>
        </div>
      </div>
    );
  }

  // form / submitting
  const submitting = createPhase === "submitting";
  return (
    <form
      className="mt-3 flex flex-col gap-2 border-t border-[var(--ubm-color-border-default)] pt-3"
      data-testid="tag-inline-create-form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {formError ? (
        <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">
          {formError}
        </p>
      ) : null}
      <FormField
        name="tag-create-code"
        label="コード"
        required
        {...(fieldErrors.code ? { error: fieldErrors.code } : {})}
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputSize="sm"
          placeholder="例: vip"
          autoComplete="off"
          disabled={submitting}
        />
      </FormField>
      <FormField
        name="tag-create-label"
        label="表示名"
        required
        {...(fieldErrors.label ? { error: fieldErrors.label } : {})}
      >
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          inputSize="sm"
          placeholder="例: VIP会員"
          autoComplete="off"
          disabled={submitting}
        />
      </FormField>
      <FormField
        name="tag-create-category"
        label="カテゴリ"
        required
        {...(fieldErrors.category ? { error: fieldErrors.category } : {})}
      >
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          inputSize="sm"
          placeholder="例: membership"
          autoComplete="off"
          disabled={submitting}
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={submitting} loading={submitting}>
          {submitting ? "作成中…" : "作成して付与"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={submitting}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
