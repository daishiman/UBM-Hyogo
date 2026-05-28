"use client";
import { useState } from "react";
import { FormField } from "../../../../components/ui/FormField";
import { Input } from "../../../../components/ui/Input";
import {
  FetchAuthedError,
  useAdminMutation,
} from "../../hooks/useAdminMutation";
import { createMeeting } from "../../../../lib/admin/api";
import { Button } from "../../../../components/ui/Button";
import { AdminSectionCard } from "../_shared";
import type { MeetingItem } from "./meetingStats";

interface CreateMeetingResponse {
  ok: true;
  meeting: MeetingItem;
}

const unwrap = async <T,>(
  r: Promise<
    | { ok: true; data: unknown }
    | { ok: false; status: number; error: string }
  >,
): Promise<T> => {
  const result = await r;
  if (!result.ok) throw new FetchAuthedError(result.status, result.error);
  return result.data as T;
};

const getMessage = (e: unknown): string => {
  if (e instanceof FetchAuthedError) return e.bodyText;
  if (e instanceof Error) return e.message;
  return "unknown error";
};

interface Props {
  readonly onCreated: (item: MeetingItem) => void;
  readonly setToast: (msg: string) => void;
}

export function MeetingCreateForm({ onCreated, setToast }: Props) {
  const [title, setTitle] = useState("");
  const [heldOn, setHeldOn] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const mutation = useAdminMutation<CreateMeetingResponse>(
    "/api/admin/meetings",
    "POST",
    {
      refreshOnSuccess: false,
      mutationFn: (payload) =>
        unwrap<CreateMeetingResponse>(
          createMeeting(
            payload as { title: string; heldOn: string; note?: string | null },
          ),
        ),
    },
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(heldOn)) return;
    setBusy(true);
    try {
      const result = await mutation.trigger({
        title: title.trim(),
        heldOn,
        note: note.trim() || null,
      });
      onCreated({ ...result.meeting, attendance: result.meeting.attendance ?? [] });
      setToast("開催日を追加しました");
      setTitle("");
      setHeldOn("");
      setNote("");
    } catch (e) {
      setToast(`開催追加に失敗: ${getMessage(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminSectionCard title="開催日を追加" density="compact">
      <form onSubmit={onSubmit} aria-label="開催日追加" className="flex flex-col gap-3">
        <FormField name="meeting-title" label="タイトル" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        <FormField name="meeting-heldOn" label="開催日 (YYYY-MM-DD)" required>
          <Input
            type="date"
            value={heldOn}
            onChange={(e) => setHeldOn(e.target.value)}
            required
          />
        </FormField>
        <FormField name="meeting-note" label="メモ">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>
        <div>
          <Button type="submit" variant="primary" disabled={busy}>
            追加
          </Button>
        </div>
      </form>
    </AdminSectionCard>
  );
}
