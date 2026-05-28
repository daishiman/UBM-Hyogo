---
spec_classification: implementation_spec
state: spec_created
phase: 2
phase_name: 設計
---

# Phase 2 — 設計

親 workflow trace: `docs/30-workflows/admin-ui-prototype-alignment/` followup-001。

## 目的

プロトタイプ準拠 UI に必要な構成要素と、ADMIN_FETCH_404 root cause 切り分けを設計レベルで確定する。

## 前提と入力

- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366
- 既存 primitive: `apps/web/src/components/ui/` （Avatar / Chip / Switch / KVList / Drawer / Field / Search / Button / Segmented / LinkPills / Stat / Badge / FormField 既存）
- 既存 ViewModel: `packages/shared/src/types/viewmodel/index.ts`

## 作業手順

### UI 構成要素抽出（プロトタイプから）

| Region | 要素 |
|--------|------|
| page-head | eyebrow `ADMIN / MEMBERS` + h-page `メンバー管理` + muted description + 右側 btn-row（`CSV エクスポート` ghost / `Forms から取り込み` primary） |
| filter card | 検索 input + pill-nav (すべて / 公開中 / 非公開 / 退会済み) + 件数バッジ |
| table | avatar / メンバー(name+occupation) / メール mono / 区画 chip + ステータス chip / タグ chips (max 2 + `+N`) / 最終更新 mono / 公開 switch + label / edit icon button |
| drawer head | avatar + name + email mono + responseId |
| drawer body | VISIBILITY セクション (公開 switch + admin memo textarea) / TAGS セクション (tag-pill chips グルーピング) / FORM RESPONSE KVList (回答ID / 送信日時 / UBM区画 / ステータス / お住まい / 職業 / ビジネス概要) / DELETED ブロック (条件付き、復元ボタン) |
| drawer foot | 退会処理(danger) / 閉じる / 保存(primary) |

### primitive 依存マッピング

| プロトタイプ要素 | 既存 primitive | 状態 |
|------------------|---------------|------|
| Chip | `apps/web/src/components/ui/Chip.tsx` | 既存。tone 5 種が揃っているか Phase 5 で確認、不足時に additive 拡張 |
| Avatar | `apps/web/src/components/ui/Avatar.tsx` | 既存。`hue` prop が無ければ Phase 5 T-5.7 で additive 追加 |
| Switch | `apps/web/src/components/ui/Switch.tsx` | 既存 |
| KVList | `apps/web/src/components/ui/KVList.tsx` | 既存 |
| Drawer | `apps/web/src/components/ui/Drawer.tsx` | 既存 |
| pill-nav | `Segmented.tsx` または `LinkPills.tsx` で代替可否を Phase 5 で確認。不足時のみ最小追加 |
| tag-pill | `Chip` で代替（variant 追加で済む想定） |
| eyebrow / h-page / card-pad / card-flat / card-hover / divider | `tokens.css` / `apps/web/src/styles/` の rhythm utility を利用 |

### adapter 設計（T-5.2）

- 入力: 既存 API レスポンス（`AdminMemberListItem` / `AdminMemberDetailView` + tag store + `answers_json`）
- 出力: 拡張 ViewModel（既存 field は維持。`occupation` / `ubmZone` / `ubmMembershipType` / `tags` / `updatedAt` / `hue` を additive）
- Zod schema は **`.optional()` または `.default(...)` で additive のみ**（既存 consumer を破壊しない）
- `hue` は `memberId` のハッシュから決定論的に派生（`stringHash(memberId) % HUE_COUNT`）
- `tags` は admin tag store からの join 結果。tag store API がない場合は `profile.tags` 風 field を `answers_json` から派生
- `updatedAt` は `audit[]` の最新 mutation の `at` を採用（不在時は `lastSubmittedAt` fallback）

### 404 root cause 切り分け設計（T-5.1）

| 仮説 | 検証手段 | 修正方針 |
|------|---------|---------|
| (a) `safeServerFetch` baseUrl 解決失敗 | staging で `console.warn` 仕込み + `apps/web/src/lib/admin/safe-server-fetch.ts` の baseUrl 算出 unit spec 追加 | `INTERNAL_API_BASE_URL` の zod schema を `getEnv()` に追加（空文字を reject） |
| (b) `app/api/admin/[...path]/route.ts` pass-through 不全 | catch-all route の `params.path` をログ出力。staging で `/admin/members` が `["members"]` として match するか確認 | matching が抜けていれば `route.ts` を修正 |
| (c) `require-admin` 401→404 マスク | `app/api/admin/[...path]/route.ts` 内の auth fail 経路 grep。401 を 404 に置換していないか確認 | 401 を素通しし、UI 側で 401 を別 banner で扱う |
| (d) D1 binding 未配線 | `apps/api/wrangler.toml` の `[env.staging]` で D1 binding が production と一致しているか diff | wrangler.toml 修正 → `bash scripts/cf.sh deploy --env staging` |

切り分け順は (a) → (b) → (c) → (d)。最も外側から狭めることで影響範囲を最小化する。

## 成果物

- 本 markdown
- `outputs/phase-2/design.md`

## 完了条件 (DoD)

- UI 構成要素表が region 5 区分すべて埋まっている
- primitive 依存マッピングで「既存 / additive / 新規」が判定されている
- adapter 設計で additive field がすべて派生元を持っている
- 404 切り分けが 4 仮説順序付きで設計されている

## 検証コマンド

```bash
mise exec -- pnpm gate-metadata:validate
```

## 想定リスク

- `answers_json` schema 揺れで派生失敗 → T-5.2 で `.optional()` + fallback で吸収

## ロールバック

- 仕様 markdown のみのため git revert で削除可

## 関連 spec

- `phase-1-requirements.md`
- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/phase-2-design.md`
