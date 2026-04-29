// 05b: 認証関連の補助型
// 重要: SessionUser / AuthGateState は viewmodel/index.ts の方が正本（branded type 使用）。
// 本ファイルは互換のための補助 alias のみ提供する。

export type SessionUserAuthGateState = "active" | "rules_declined" | "deleted";
