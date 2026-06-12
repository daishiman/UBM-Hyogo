# 実装ガイド — admin-members-timestamp-jst-and-identity-label-clarity

## Part 1: やさしい説明

会員管理画面では、運営者が「いつ更新されたか」「本人情報や診断情報が何を意味するか」をすぐ読める必要がある。
以前は `2026-06-09T10:34:19.996603Z` のようなコンピュータ向け日時や、`memberId` / `public visible` / `true` / `false` が画面に出ていた。
今回、画面に出す直前の翻訳係を追加し、日時は `2026年6月9日 19:34:19`、真偽値は `はい/いいえ`、項目名は日本語主・英語キー併記にした。

データベースや API の中身は変えていない。データは正しく、読みにくかったのは表示だけだったため、`apps/web` の表示層だけを直した。
英語キーは小さく残しているので、運営者は日本語で読め、開発者は元のキーを追える。

## Part 2: 技術詳細

### 実装

| AC | 実装 |
| --- | --- |
| AC-1/2 | `formatJstDateTimeWithSeconds(iso)` を `apps/web/src/lib/format/datetime.ts` に追加。`Intl.DateTimeFormat(..., timeZone:"Asia/Tokyo").formatToParts()` で年月日漢字 + 秒までを組み立て、不正値は元入力を返す |
| AC-3/4/8 | `MemberDrawer.tsx` の IDENTITY セクションを `memberSystemFieldGlossary.ts` 経由の日本語ラベル + 英語キー併記へ変更し、boolean を `formatBooleanJa()` へ置換 |
| AC-5/6/8 | `MemberDiagnosticsPanel.tsx` の DIAGNOSTICS セクションを同じ SSOT で日本語化し、`yes/no` を `はい/いいえ` へ置換 |
| AC-7 | `MEMBER_IDENTITY_FIELD_LABELS`, `MEMBER_DIAGNOSTICS_FIELD_LABELS`, `MEMBER_SYSTEM_SECTION_LABELS`, `formatBooleanJa()` を新規 SSOT に集約 |
| AC-9/10 | 新色・新 API・D1 migration・Google Form schema は追加しない |

### 検証

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/format/__tests__/datetime.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/memberSystemFieldGlossary.spec.ts \
  apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.identityLabels.spec.tsx \
  apps/web/src/features/admin/components/_members/__tests__/MemberDiagnosticsPanel.spec.tsx
```

Result: 5 files / 41 tests PASS.

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-members-timestamp-jst-identity-labels.spec.ts \
  --project=desktop-chromium --timeout=180000
```

Result: 1 test PASS, screenshots:

- `outputs/phase-11/screenshots/members-last-updated-jst.png`
- `outputs/phase-11/screenshots/member-drawer-identity-ja.png`
- `outputs/phase-11/screenshots/member-diagnostics-ja.png`

### user-gated

staging authenticated screenshot、commit、push、PR は未実行。local fixture evidence は取得済み。
