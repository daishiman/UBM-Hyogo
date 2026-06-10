"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import {
  createTag,
  TagCreateError,
  type AdminTagCreateInput,
} from "../../features/admin/api/tags";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
import type { TagDefinitionItem } from "./tagCatalogLifecycle";

const CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/;

const createErrorMessage = (code: string | null): string => {
  if (code === "tag_code_conflict") {
    return "同じコードのタグが既にあります。別のコードを指定してください。";
  }
  if (code === "invalid_body" || code === "invalid_json") {
    return "入力値を確認してください。";
  }
  return "タグを作成できませんでした。";
};

export interface TagDefinitionCreateFormProps {
  readonly onCreated: (tag: TagDefinitionItem) => void;
}

export function TagDefinitionCreateForm({ onCreated }: TagDefinitionCreateFormProps) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const validation = useMemo(() => {
    if (!CODE_PATTERN.test(code.trim())) {
      return "コードは英小文字・数字・_ の64文字以内で入力してください。";
    }
    if (label.trim().length === 0) return "表示名を入力してください。";
    if (category.trim().length === 0) return "カテゴリを入力してください。";
    return null;
  }, [category, code, label]);

  const mutation = useAdminMutation<TagDefinitionItem>("/api/admin/tags", "POST", {
    mutationFn: (payload) => createTag(payload as AdminTagCreateInput),
    onSuccess: (created) => {
      setCode("");
      setLabel("");
      setCategory("");
      setFormError(null);
      onCreated(created);
    },
    onError: (error) => {
      if (error instanceof TagCreateError) {
        setFormError(createErrorMessage(error.code));
        return;
      }
      setFormError(error.message);
    },
    successMessage: "タグを作成しました",
    refreshOnSuccess: false,
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    try {
      await mutation.trigger({
        code: code.trim(),
        label: label.trim(),
        category: category.trim(),
      });
    } catch {
      // useAdminMutation invokes onError above.
    }
  };

  const fieldError = (message: string) =>
    formError === message ? { error: formError } : {};

  return (
    <form className="tag-master-card card-pad-lg" aria-label="タグ作成" onSubmit={onSubmit}>
      <div className="tag-master-card__head">
        <div>
          <h2>タグ作成</h2>
          <p className="muted">既存の tag master API に新しいタグ定義を追加します。</p>
        </div>
      </div>
      <FormField
        name="tag-definition-create-code"
        label="コード"
        required
        {...fieldError("コードは英小文字・数字・_ の64文字以内で入力してください。")}
      >
        <Input value={code} onChange={(event) => setCode(event.currentTarget.value)} />
      </FormField>
      <FormField
        name="tag-definition-create-label"
        label="表示名"
        required
        {...fieldError("表示名を入力してください。")}
      >
        <Input value={label} onChange={(event) => setLabel(event.currentTarget.value)} />
      </FormField>
      <FormField
        name="tag-definition-create-category"
        label="カテゴリ"
        required
        {...fieldError("カテゴリを入力してください。")}
      >
        <Input value={category} onChange={(event) => setCategory(event.currentTarget.value)} />
      </FormField>
      {formError && !validation ? (
        <p className="tag-master-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="tag-master-actions">
        <Button type="submit" variant="primary" loading={mutation.isLoading}>
          作成
        </Button>
      </div>
    </form>
  );
}
