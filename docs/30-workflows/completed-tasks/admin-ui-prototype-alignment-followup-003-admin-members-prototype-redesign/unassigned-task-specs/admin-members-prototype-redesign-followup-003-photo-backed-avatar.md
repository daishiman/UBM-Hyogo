# admin-members-prototype-redesign-followup-003 — photo-backed avatar rendering

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-members-prototype-redesign-followup-003 |
| 分類 | implementation / storage / API contract |
| 優先度 | 低 (priority:low) |
| 規模 | 中 (scale:medium) |
| ステータス | unassigned |
| 発見元 | admin-ui-prototype-alignment-followup-003 Phase 12 unassigned-task-detection (候補 3) |
| 発見日 | 2026-05-27 |
| 親ワークフロー | admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign |
| visualEvidence | VISUAL_ON_EXECUTION |

## 背景

親ワークフローで `MemberAvatar` を hue 派生 (memberId hash → OKLch hue 8 段) で実装したが、プロトタイプ正本は photo URL を持つ場合に実写真を render する想定。現状 `AdminMemberListView` / `AdminMemberDetailView` は photo URL を返さず、storage contract も未確定。

Google Form の項目に「写真」枠は存在しない (`docs/00-getting-started-manual/google-form/`)。photo の入手経路 (form 追加 / 管理者アップロード / 外部 URL) を product 側で決める必要がある。

## 概要

photo URL を AdminMember view に追加し、`MemberAvatar` に photo > hue placeholder の優先順位を持たせる。storage contract (R2 / Cloudflare Images / 外部 URL) は本タスク内で決定する。

## 苦戦箇所【記入必須】

- 親 workflow は「既存 API surface のみ利用」「Google Form schema 変更禁止」を不変条件にしていたため、hue 派生の placeholder で握り潰した。プロトタイプは photo 表示前提で組まれており、placeholder 描画は「写真未取得」を意図する設計ではなかった。
- photo の入手経路を決めずに UI 配線 (photo URL prop) だけ追加すると、storage layer / migration / 管理者アップロード UI の 3 系統が後追いで割れる。MVP では「管理者アップロード経路」「R2 / Cloudflare Images どちらか」を最初に decision する必要がある。
- Cloudflare Images は無料枠を超えるため `08-free-database.md` の制約と整合させる必要がある (R2 + 署名付き URL の方が現実的)。
- photo を持つ / 持たない member の混在 list で「avatar が突然 hue→写真に切り替わる」UX 不整合を避ける必要があり、`MemberAvatar` の placeholder→photo 移行は明示的な loading state を持たせる方が安全。

## 目的

- photo URL を AdminMember view に追加し、MemberAvatar で実写真を render する
- storage contract (R2 + 署名付き URL を第一候補) を確定する
- hue placeholder を残し、photo 未登録時は従来通り hue で描画する

## スコープ

含む:

- storage contract 設計書 (`docs/00-getting-started-manual/specs/` 配下に追加 or 既存に追記)
- R2 bucket + 署名付き URL 発行 endpoint (apps/api) 設計
- `AdminMemberDetailView` (drawer 用) に `photoUrl?: string` を追加 (list は signed URL の TTL コストを考慮し含めない可能性あり)
- `MemberAvatar` を photo > hue placeholder の二段 render に拡張
- 管理者アップロード UI は drawer 内に最小限の affordance (本 followup の任意項目)
- apps/api route test、apps/web avatar render spec、storage signing test

含まない:

- Google Form への写真項目追加 (invariant 違反)
- 一般 member 自身の photo upload (admin 経由のみ)
- 画像 transcoding / resize (R2 静的保存のみ。将来 Cloudflare Images 移行は別タスク)
- 公開 directory (`/(public)/members/[id]`) での photo 表示 (本 followup のスコープ外。別 followup 化を想定)

## 受入条件 (Acceptance Criteria)

- AC-1: storage contract が `docs/00-getting-started-manual/specs/` 配下に明文化され、R2 bucket 名・署名 TTL・パスフォーマットが固定されている
- AC-2: `AdminMemberDetailView.photoUrl` が optional として shared schema に追加され、parse error を起こさない
- AC-3: `MemberAvatar` が photo URL ありの場合は `<img>` を、未取得 / 失敗時は hue placeholder を render する
- AC-4: 写真未登録 member の表示は親 workflow の hue placeholder と pixel diff が無い (visual baseline 維持)
- AC-5: R2 アクセスは署名付き URL 経由のみで、bucket public list を許可しない (`08-free-database.md` 制約と整合)
- AC-6: アップロード経路を実装する場合、admin 限定 endpoint で MIME / サイズ制限 + audit `admin.member.photo_uploaded` を記録

## リスクと対策

| リスク | 対策 |
| --- | --- |
| R2 無料枠超過 | 1 member 1 photo + 上限サイズ (例: 256KB) で contract に明記 |
| 署名付き URL の TTL 切れで画像が消える | TTL は drawer 用に短く (例: 5min)、list 用は含めない or キャッシュ層を追加 |
| photo→hue 切替で UX 不安定 | `<img>` `onError` で hue placeholder へ fallback、loading state も明示 |

## 検証方法

- storage signing test (apps/api): TTL / 署名検証
- apps/web spec: MemberAvatar の photo / hue 二段 render を assert
- Playwright visual: photo 有り / 無し の baseline を分けて取得

## 上流前提

- followup-001 (list response enrichment) の shape 決定後に着手すると整合性が取りやすい
- `08-free-database.md` の無料枠制約を遵守

## 関連参照

- `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/outputs/phase-12/unassigned-task-detection.md` (候補 3 の出典)
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` (現行 hue placeholder)

## GitHub Issue

- #983 — https://github.com/daishiman/UBM-Hyogo/issues/983
- labels: `priority:low`, `scale:medium`, `type:followup`, `area:api`, `area:web`, `area:admin-ui`, `wave:2-plus`, `unassigned`
