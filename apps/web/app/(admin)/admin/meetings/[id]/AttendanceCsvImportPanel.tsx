"use client";
// ut-07c-followup-001: meeting attendance CSV 一括 import の 3 ステップ wizard。
// state machine: idle → parsing → preview → confirming → done (or error)
// 既存 MeetingAttendancePanel の sibling として配置。既存 panel は変更しない。
import * as React from "react";
import { useReducer, useRef, type ChangeEvent } from "react";
import {
  parseAttendanceCsv,
  type ParsedAttendanceRow,
} from "../../../../../src/lib/csv/parse-attendance";

type RowStatus = "ok" | "duplicate" | "deleted_member" | "unknown_member" | "invalid";

interface ImportRowResult {
  index: number;
  status: RowStatus;
  memberId?: string;
  message?: string;
}

interface ImportSummary {
  total: number;
  ok: number;
  duplicate: number;
  deletedMember: number;
  unknownMember: number;
  invalid: number;
}

interface ImportResponse {
  ok: true;
  summary: ImportSummary;
  rows: ImportRowResult[];
  dryRun: boolean;
  committed: boolean;
}

type State =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "preview"; rows: ParsedAttendanceRow[]; result: ImportResponse }
  | { kind: "confirming"; rows: ParsedAttendanceRow[] }
  | { kind: "done"; result: ImportResponse }
  | { kind: "error"; message: string };

type Action =
  | { type: "start-parsing" }
  | { type: "parse-done"; rows: ParsedAttendanceRow[]; result: ImportResponse }
  | { type: "start-confirming"; rows: ParsedAttendanceRow[] }
  | { type: "commit-done"; result: ImportResponse }
  | { type: "fail"; message: string }
  | { type: "reset" };

const initial: State = { kind: "idle" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start-parsing":
      return { kind: "parsing" };
    case "parse-done":
      return { kind: "preview", rows: action.rows, result: action.result };
    case "start-confirming":
      return { kind: "confirming", rows: action.rows };
    case "commit-done":
      return { kind: "done", result: action.result };
    case "fail":
      return { kind: "error", message: action.message };
    case "reset":
      return initial;
    default:
      return state;
  }
}

const mapHttpErrorToMessage = (status: number): string => {
  if (status === 413) return "500 行を超えています";
  if (status === 400) return "データ形式不正";
  if (status === 401 || status === 403) return "権限がありません。再ログインしてください";
  if (status === 404) return "meeting が見つかりません";
  return "サーバエラー。時間をおいて再試行してください";
};

const statusLabel: Record<RowStatus, string> = {
  ok: "ok",
  duplicate: "duplicate",
  deleted_member: "deleted_member",
  unknown_member: "unknown_member",
  invalid: "invalid",
};

const statusTone: Record<RowStatus, React.CSSProperties> = {
  ok: { background: "oklch(0.96 0.04 154)", color: "oklch(0.34 0.12 154)", borderColor: "oklch(0.82 0.14 154)" },
  duplicate: { background: "oklch(0.96 0.04 70)", color: "oklch(0.42 0.12 54)", borderColor: "oklch(0.84 0.12 70)" },
  deleted_member: { background: "oklch(0.96 0.04 25)", color: "oklch(0.38 0.16 25)", borderColor: "oklch(0.84 0.10 25)" },
  unknown_member: { background: "oklch(0.96 0.03 245)", color: "oklch(0.42 0.13 245)", borderColor: "oklch(0.84 0.09 245)" },
  invalid: { background: "oklch(0.96 0.04 300)", color: "oklch(0.40 0.14 300)", borderColor: "oklch(0.84 0.10 300)" },
};

function StatusPill({ status }: { status: RowStatus }): React.JSX.Element {
  return (
    <span
      data-testid="status-pill"
      data-status={status}
      style={{
        display: "inline-flex",
        alignItems: "center",
        minWidth: 88,
        justifyContent: "center",
        border: "1px solid",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
        ...statusTone[status],
      }}
    >
      {statusLabel[status]}
    </span>
  );
}

function SummaryLine({ summary }: { summary: ImportSummary }): React.JSX.Element {
  return (
    <p data-testid="import-summary">
      合計 {summary.total} 行 / ok {summary.ok} / duplicate {summary.duplicate} /
      deleted_member {summary.deletedMember} / unknown_member {summary.unknownMember} /
      invalid {summary.invalid}
    </p>
  );
}

interface Props {
  sessionId: string;
}

export function AttendanceCsvImportPanel({ sessionId }: Props): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, initial);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const callImport = async (
    rows: ParsedAttendanceRow[],
    dryRun: boolean,
  ): Promise<ImportResponse> => {
    const r = await fetch(
      `/api/admin/meetings/${encodeURIComponent(sessionId)}/attendance/import?dryRun=${dryRun ? "true" : "false"}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows }),
      },
    );
    if (!r.ok) {
      const message = mapHttpErrorToMessage(r.status);
      throw new Error(message);
    }
    return (await r.json()) as ImportResponse;
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: "start-parsing" });
    try {
      const text = await file.text();
      const parsed = parseAttendanceCsv(text);
      const parserErrors = parsed.errors.filter((err) => err.message !== "memberId_or_email_required");
      if (parserErrors.length > 0) {
        dispatch({ type: "fail", message: "CSV の解析に失敗しました" });
        return;
      }
      if (parsed.rows.length === 0) {
        dispatch({ type: "fail", message: "有効な行がありません" });
        return;
      }
      if (parsed.rows.length > 500) {
        dispatch({ type: "fail", message: "500 行を超えています" });
        return;
      }
      const result = await callImport(parsed.rows, true);
      dispatch({ type: "parse-done", rows: parsed.rows, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラー";
      dispatch({ type: "fail", message });
    }
  };

  const onConfirm = async () => {
    if (state.kind !== "preview") return;
    const rows = state.rows;
    dispatch({ type: "start-confirming", rows });
    try {
      const result = await callImport(rows, false);
      dispatch({ type: "commit-done", result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラー";
      dispatch({ type: "fail", message });
    }
  };

  const onReset = () => {
    if (fileRef.current) fileRef.current.value = "";
    dispatch({ type: "reset" });
  };

  const currentStep =
    state.kind === "idle" || state.kind === "parsing"
      ? 1
      : state.kind === "preview"
        ? 2
        : state.kind === "confirming" || state.kind === "done"
          ? 3
          : 1;

  return (
    <section
      aria-labelledby="attendance-csv-import-h"
      data-testid="attendance-csv-import-panel"
    >
      <h2 id="attendance-csv-import-h">出席 CSV 一括登録</h2>
      <ol aria-label="import-steps" data-testid="import-steps">
        <li aria-current={currentStep === 1 ? "step" : undefined}>1. CSV upload</li>
        <li aria-current={currentStep === 2 ? "step" : undefined}>2. preview</li>
        <li aria-current={currentStep === 3 ? "step" : undefined}>3. confirm</li>
      </ol>

      {state.kind === "idle" && (
        <div data-testid="step-upload">
          <label>
            CSV ファイル (memberId / email カラム必須、最大 500 行)
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              data-testid="csv-file-input"
              onChange={onFile}
            />
          </label>
        </div>
      )}

      {state.kind === "parsing" && (
        <p role="status" data-testid="step-parsing">
          解析中...
        </p>
      )}

      {state.kind === "preview" && (
        <div data-testid="step-preview">
          <SummaryLine summary={state.result.summary} />
          <table data-testid="preview-rows">
            <caption>preview rows</caption>
            <thead>
              <tr>
                <th>#</th>
                <th>status</th>
                <th>memberId</th>
                <th>message</th>
              </tr>
            </thead>
            <tbody>
              {state.result.rows.map((row) => (
                <tr key={row.index} data-status={row.status} data-testid="preview-row">
                  <td>{row.index}</td>
                  <td>
                    <StatusPill status={row.status} />
                  </td>
                  <td>{row.memberId ?? ""}</td>
                  <td>{row.message ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            data-testid="confirm-import"
            disabled={state.result.summary.ok === 0 || state.result.summary.ok !== state.result.summary.total}
            onClick={onConfirm}
          >
            {state.result.summary.ok} 件を登録する
          </button>
          <button type="button" data-testid="cancel-import" onClick={onReset}>
            やり直す
          </button>
        </div>
      )}

      {state.kind === "confirming" && (
        <p role="status" data-testid="step-confirming">
          登録中...
        </p>
      )}

      {state.kind === "done" && (
        <div data-testid="step-done">
          <p>{state.result.summary.ok} 件を登録しました</p>
          <SummaryLine summary={state.result.summary} />
          <button type="button" data-testid="reset-import" onClick={onReset}>
            続けて別ファイルを登録する
          </button>
        </div>
      )}

      {state.kind === "error" && (
        <div role="alert" data-testid="step-error">
          <p>{state.message}</p>
          <button type="button" data-testid="reset-import" onClick={onReset}>
            やり直す
          </button>
        </div>
      )}
    </section>
  );
}
