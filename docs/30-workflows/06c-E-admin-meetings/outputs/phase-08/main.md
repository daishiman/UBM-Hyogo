# Phase 8 Output: DRY化

Status: completed

既存 helper / route を再利用し、新規抽象は CSV escape と meeting export read model に限定した。`attendance.ts` route は保持し、06c-E 用 alias は `meetings.ts` に薄く追加した。
