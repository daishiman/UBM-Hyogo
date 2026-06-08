"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../../components/ui/Button";
import { FormField } from "../../../../components/ui/FormField";
import { Input } from "../../../../components/ui/Input";
import {
  type AdminTagRef,
  type AdminTagUpdateInput,
  parseTagUpdateErrorCode,
  TagUpdateError,
  updateTag,
} from "../../api/tags";
import { FetchAuthedError, useAdminMutation } from "../../hooks/useAdminMutation";

const CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/;

const conflictMessage = (code: string | null): string => {
  if (code === "tag_code_conflict") {
    return "同じコードのタグが既にあります。別のコードを指定してください。";
  }
  if (code === "tag_stale_conflict") {
    return "保存前に別の変更が入りました。画面を更新して最新のコードを確認してください。";
  }
  if (code === "tag_not_found") {
    return "対象のタグが見つかりません。一覧を再読み込みしてください。";
  }
  if (code === "no_update_fields") {
    return "変更内容がありません。少なくとも1項目を編集してください。";
  }
  if (code === "invalid_body" || code === "invalid_json") {
    return "入力値を確認してください。";
  }
  return "保存できませんでした。";
};

export interface TagMasterEditFormProps {
  readonly tag: AdminTagRef | null;
  readonly onSaved: (tag: AdminTagRef) => void;
}

export function buildTagUpdateInput(
  tag: AdminTagRef,
  input: { readonly code: string; readonly label: string; readonly category: string },
): AdminTagUpdateInput {
  const next: {
    code?: string;
    label?: string;
    category?: string;
    expectedCode?: string;
  } = {};
  const code = input.code.trim();
  const label = input.label.trim();
  const category = input.category.trim();

  if (code !== tag.code) {
    next.code = code;
    next.expectedCode = tag.code;
  }
  if (label !== tag.label) next.label = label;
  if (category !== tag.category) next.category = category;

  return next;
}

export function TagMasterEditForm({ tag, onSaved }: TagMasterEditFormProps) {
  const [code, setCode] = useState(tag?.code ?? "");
  const [label, setLabel] = useState(tag?.label ?? "");
  const [category, setCategory] = useState(tag?.category ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setCode(tag?.code ?? "");
    setLabel(tag?.label ?? "");
    setCategory(tag?.category ?? "");
    setFormError(null);
  }, [tag]);

  const endpoint = tag ? `/api/admin/tags/${encodeURIComponent(tag.tagId)}` : "/api/admin/tags";
  const mutation = useAdminMutation<AdminTagRef>(endpoint, "PATCH", {
    mutationFn: (payload) => {
      if (!tag) throw new Error("タグが選択されていません。");
      return updateTag(tag.tagId, payload as AdminTagUpdateInput);
    },
    onSuccess: (updated) => {
      setFormError(null);
      onSaved(updated);
    },
    onError: (error) => {
      if (error instanceof TagUpdateError) {
        setFormError(conflictMessage(error.code));
        return;
      }
      if (error instanceof FetchAuthedError) {
        setFormError(conflictMessage(parseTagUpdateErrorCode(error.bodyText)));
        return;
      }
      setFormError(error.message);
    },
    successMessage: "タグを保存しました",
  });

  const validation = useMemo(() => {
    if (!tag) return null;
    if (!CODE_PATTERN.test(code.trim())) {
      return "コードは英小文字・数字・_ の64文字以内で入力してください。";
    }
    if (label.trim().length === 0) return "表示名を入力してください。";
    if (category.trim().length === 0) return "カテゴリを入力してください。";
    return null;
  }, [category, code, label, tag]);

  const dirty =
    !!tag &&
    (code.trim() !== tag.code ||
      label.trim() !== tag.label ||
      category.trim() !== tag.category);
  const codeError =
    formError && !CODE_PATTERN.test(code.trim()) ? { error: formError } : {};
  const labelError =
    formError === "表示名を入力してください。" ? { error: formError } : {};
  const categoryError =
    formError === "カテゴリを入力してください。" ? { error: formError } : {};

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tag) return;
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    try {
      await mutation.trigger(buildTagUpdateInput(tag, {
        code: code.trim(),
        label: label.trim(),
        category: category.trim(),
      }));
    } catch {
      // useAdminMutation invokes onError above; prevent event-handler unhandled rejections.
    }
  };

  if (!tag) {
    return (
      <section className="tag-master-card card-pad-lg" aria-label="タグ編集">
        <p className="muted">左の一覧からタグを選択してください。</p>
      </section>
    );
  }

  return (
    <form
      className="tag-master-card card-pad-lg"
      aria-label={`${tag.label} を編集`}
      onSubmit={onSubmit}
    >
      <div className="tag-master-card__head">
        <div>
          <h2>タグ編集</h2>
          <p className="muted">
            現在の code <code>{tag.code}</code> を expectedCode として送信します。
          </p>
        </div>
      </div>
      <FormField
        name="tag-master-code"
        label="コード"
        required
        {...codeError}
      >
        <Input value={code} onChange={(event) => setCode(event.currentTarget.value)} />
      </FormField>
      <FormField
        name="tag-master-label"
        label="表示名"
        required
        {...labelError}
      >
        <Input value={label} onChange={(event) => setLabel(event.currentTarget.value)} />
      </FormField>
      <FormField
        name="tag-master-category"
        label="カテゴリ"
        required
        {...categoryError}
      >
        <Input value={category} onChange={(event) => setCategory(event.currentTarget.value)} />
      </FormField>
      {formError && !validation ? (
        <p className="tag-master-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="tag-master-actions">
        <Button type="submit" variant="primary" loading={mutation.isLoading} disabled={!dirty}>
          保存
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!dirty || mutation.isLoading}
          onClick={() => {
            setCode(tag.code);
            setLabel(tag.label);
            setCategory(tag.category);
            setFormError(null);
          }}
        >
          元に戻す
        </Button>
      </div>
    </form>
  );
}
