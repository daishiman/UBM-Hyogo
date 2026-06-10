import { ZodError } from "zod";

export function formatSchemaHistoryError(error: unknown): string {
  if (error instanceof ZodError) {
    return "履歴データの形式が想定と一致しませんでした。時間をおいて再読み込みしてください。";
  }
  if (error instanceof Error) {
    if (/HTTP\s+\d+/.test(error.message)) {
      return "履歴データを取得できませんでした。通信状態を確認して再度お試しください。";
    }
  }
  return "履歴の取得に失敗しました。時間をおいて再度お試しください。";
}
