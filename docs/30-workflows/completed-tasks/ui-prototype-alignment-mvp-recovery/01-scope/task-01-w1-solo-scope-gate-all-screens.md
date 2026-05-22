# task-01-scope-gate-all-screens

[実装区分: 実装仕様書]
推定工数: 0.5 人日（docs 編集中心 / レビュー同期含む）
依存タスク: なし（本タスクは workflow 全体の先行ゲート）
並列実行: 不可（後続 task-02..22 の前提条件 / W1 単独 wave）

> 本タスクはコード変更を伴わない docs 専用タスクであるが、CLAUDE.md および `docs/00-getting-started-manual/specs/` の正本 docs を改変するため、CONST_005 における「ファイル変更を伴うタスク」として実装仕様書フォーマットで記述する。後続 21 タスクが参照する「全画面実装スコープ」「既存 API のみ接続」「OKLch トークン正本化」の 3 合意を文書化することが目的。

---

## 0. 自己完結コンテキスト

> 本セクションは「このタスクファイル単体で実装着手可能にする」ための自己完結要約。`outputs/phase-{1,2,3}/phase-N.md` を再度開かずに済むよう、必要情報を本ファイル内に閉じ込める。phase-N.md への参照は trace 用に残すが、§0 を読めば独立して着手できる粒度を担保する。

### 0.1 上位ゴール（1 段落）

UI prototype alignment / MVP recovery ワークフロー全体の上位ゴールは、**UBM 兵庫支部会メンバーサイトの全 19 routes（公開 6 / 会員 2 / 管理 8 / 共通 3）を OKLch トークンで正本化されたデザイン言語の下で稼働させる**こと。新規 API endpoint・D1 schema 変更・Google Form 仕様変更を一切伴わず、`apps/api/src/routes/` 配下の既存 endpoint surface のみを接続対象とし、shape 乖離は UI 側 adapter で吸収する。プロトタイプ未掲載画面（register / privacy / terms / 管理画面群）も同一 primitives 群（task-10 で確定する 13 primitive）で構成し、新規 primitive を生やさない。

### 0.2 本タスクの DAG 座標

- **依存元（前提完了）**: なし（workflow 全体の先行ゲート / W1 単独 wave）
- **依存先（このタスク完了で着手可）**: task-02..22 全 21 タスク
- **並列性**: 単独 wave（W1）。本タスク完了まで W2 以降は起動しない
- **DAG 詳細**: `outputs/phase-2/phase-2.md` §3

### 0.3 触れるファイル群（要約）

| path | 種別 | 概要 |
|------|------|------|
| `CLAUDE.md` | edit | 「UI prototype alignment / MVP recovery」セクションを `## 参照ドキュメント` 直前に追記 |
| `docs/00-getting-started-manual/specs/00-overview.md` | edit | 末尾に「画面一覧（19 routes）と API mapping」節を追加 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | new | 19 routes 一覧 / API mapping 要約 / 不変条件 / 正本順位 / 後続導線を集約 |

> 詳細差分は §3 / §5 を参照。コード変更ゼロ。

### 0.4 既存 API endpoint surface（不変・触れない）

`apps/api/src/routes/` 配下の現行 surface のみを利用する。**新 endpoint 追加禁止**。

- **auth**: `POST /auth/magic-link`, `GET /auth/gate-state`, `GET /auth/session-resolve`, `GET /auth/schemas`
- **me**: `GET /me`, `POST /me/visibility-request`, `POST /me/delete-request`
- **public**: `GET /public/stats`, `GET /public/members`, `GET /public/member-profile/:id`, `GET /public/form-preview`
- **admin**: `GET /admin/dashboard`, `GET /admin/members`, `POST /admin/member-status`, `POST /admin/member-delete`, `GET /admin/member-notes/:id`, `GET /admin/tags-queue`, `POST /admin/tags-queue/:id/decision`, `GET/POST /admin/meetings`, `PATCH /admin/meetings/:id`, `GET /admin/attendance`, `GET /admin/schema`, `POST /admin/sync-schema`, `POST /admin/sync`, `POST /admin/responses-sync`, `GET /admin/requests`, `POST /admin/requests/:id/decision`, `GET /admin/identity-conflicts`, `POST /admin/identity-conflicts/:id/resolve`, `GET /admin/audit`

shape 乖離発生時は API を変更せず `apps/web` 側に adapter 層を置く（phase-1 §3 末尾方針）。

### 0.5 重要な不変条件（CLAUDE.md より）

1. 実フォーム schema をコードに固定しすぎない
2. consent キーは `publicConsent` / `rulesConsent` に統一
3. `responseEmail` はフォーム項目ではなく system field
4. D1 への直接アクセスは `apps/api` 内のみ（`apps/web` から binding 禁止）
5. GAS prototype は本番バックエンド仕様に昇格させない
6. MVP では Google Form 再回答が本人更新の正式経路

加えて本ワークフロー固有の不変条件:

7. 既存 API のみ接続（新 endpoint / D1 schema / Form 仕様の変更禁止）
8. OKLch トークン正本化（HEX 直書き / `bg-[#xxx]` 禁止）
9. 新 primitive を生やさない（task-10 で確定する 13 primitive 内で完結）

### 0.6 連携シグネチャ（このタスクで定義し他タスクが参照）

後続 task-02..22 が grep / 相対パス参照する正本シグネチャ:

- **SCOPE.md の章立て**: `## 1. 全画面実装スコープ（19 routes）` / `## 2. API 接続マッピング要約` / `## 3. 不変条件` / `## 4. 正本順位` / `## 5. 後続タスク導線`
- **mapping 表（§1）の列構成**: `| 層 | route | プロトタイプ掲載 | 設計指針 |`
- **API mapping 表（§2）の列構成**: `| 画面群 | 主要 endpoint |`
- **CLAUDE.md 追記アンカー**: `## UI prototype alignment / MVP recovery（進行中ワークフロー）`
- **specs/00-overview.md 追記アンカー**: `## 画面一覧（19 routes）と API mapping`

後続タスクは `[SCOPE.md](../SCOPE.md)` の相対パスでこれらを参照する。

### 0.7 用語（このファイル限定の確定定義）

- **「全画面スコープ」**: 公開 6 + 会員 2 + 管理 8 + 共通 3 = **計 19 routes**。旧 MVP 4 画面から拡張済み。phase-1 §2.2 確定。
- **「OKLch トークン正本化」**: prototype `styles.css` L1-70 の OKLch 定義を task-09 で `apps/web/src/styles/tokens.css` に転記し、`@theme` bridge で Tailwind に流す。`specs/09b-design-tokens.md`（task-08）と `tokens.css` の 2 ファイルが色の正本。HEX 直書き / arbitrary value（`bg-[#xxx]`）は CI gate `verify-design-tokens`（task-18）で fail 判定。
- **「既存 API のみ接続」**: §0.4 に列挙した `apps/api/src/routes/` 配下の現行 endpoint surface 内で UI 実装が完結すること。新 endpoint 追加・D1 schema 変更・Google Form 改変はワークフロー全体で禁止。
- **「正本順位」**: SCOPE.md > phase-{1,2,3}.md > specs/*.md > prototype の 4 段階優先度。衝突時は上位を採用。

---

## 1. 目的

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1` で確定したスコープ拡張（旧 MVP 4 画面 → 全 19 routes）を、**プロジェクト正本ドキュメントに反映する**ことが本タスクの単一責務である。

具体的には次の 3 合意を書き起こす:

1. **全画面実装スコープ**: 公開 6 / 会員 2 / 管理 8 / 共通 3 = 19 routes すべてを本ワークフローで実装対象とする。
2. **既存 API のみ接続（API 不変条件）**: `apps/api/src/routes/` 配下の現行 endpoint surface のみを利用し、新 endpoint・D1 schema 変更・Google Form 仕様変更は禁止する。
3. **OKLch トークン正本化**: `apps/web/src/styles/tokens.css`（task-09 で作成）と `specs/09b-design-tokens.md`（task-08）が色の正本であり、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` などのトークン外記述を禁止する。

これら 3 合意が CLAUDE.md / specs / SCOPE.md の 3 箇所に明文化されることで、task-02..22 の実装者（および AI エージェント）が判断に迷わないゲートを設置する。

---

## 2. ゴール / 非ゴール

### 2.1 ゴール（Definition of Done）

| ID | 条件 | 検証 |
|----|------|------|
| G-01 | CLAUDE.md に「UI prototype alignment / MVP recovery」セクションが追記され、19 routes スコープと 3 不変条件が記述されている | `grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md` が 1 件以上 |
| G-02 | `specs/00-overview.md` に画面一覧（19 routes）と API mapping の参照リンクが追記されている | `grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md` で 1 件以上 |
| G-03 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` が新規作成され、phase-1 の §1〜§3 と整合している | `test -f` 成功 + 目視レビュー |
| G-04 | 後続 task-02..22 が `SCOPE.md` を「正本」として参照可能な記述粒度になっている | mapping 表に 19 routes すべてが行として存在 |
| G-05 | markdown lint が通る（headings / list / link 整合） | `pnpm --filter docs lint` または `pnpm lint` のサブセット成功 |

### 2.2 非ゴール

- コード変更（`apps/web/`, `apps/api/`, `packages/*` への変更は task-02 以降）
- 新 API endpoint の追加 / D1 schema 変更 / Google Form 改変
- 画面実装 / primitives 実装 / Tailwind 設定（task-09, 10, 11..17）
- CI gate 実装（`verify-design-tokens` / Playwright smoke は task-18）
- phase-1 / phase-2 / phase-3 の `phase-N.md` 自体の改訂（既に確定済みであり本タスクでは触らない）

---

## 3. 変更対象ファイル

| path（リポジトリルート起点） | 種別 | 概要 |
|---|---|---|
| `CLAUDE.md` | edit | 「UI prototype alignment / MVP recovery」セクションを末尾近傍に追記。19 routes スコープ・既存 API のみ接続・OKLch 正本化を明文化 |
| `docs/00-getting-started-manual/specs/00-overview.md` | edit | 画面一覧（19 routes）と API mapping への参照（SCOPE.md / phase-3 §2）を追記 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | new | 19 routes 一覧 / API 接続マッピング要約 / 正本順位 / 不変条件を 1 ファイルに集約 |

> 注: phase-1.md / phase-2.md / phase-3.md は既に確定済みであり、SCOPE.md からのリンク参照のみとする。

---

## 4. 関数 / 型シグネチャ

本タスクは docs 編集のため**該当なし**。コード変更を伴わないため、TypeScript 型 / 関数 / API export の変更は発生しない。後続 task-10 で primitives 型、task-11..17 で API client 型が新設される予定だが本タスクの責務外。

---

## 5. 入力・出力・副作用（差分定義）

### 5.1 CLAUDE.md（edit）

**追記位置**: `## 参照ドキュメント` セクションの**直前**（既存セクション末尾の安定位置）。

**追記する文面**:

```markdown
---

## UI prototype alignment / MVP recovery（進行中ワークフロー）

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/` を参照。

### スコープ（19 routes）

| 層 | 数 | routes |
|----|----|--------|
| 公開 | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員 | 2 | `/login`, `/profile` |
| 管理 | 8 | `/(admin)/admin`, `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}` |
| 共通 | 3 | `error.tsx`, `not-found.tsx`, `loading.tsx` |

### 不変条件（task-02..22 共通）

1. **既存 API のみ接続**: `apps/api/src/routes/` 配下の現行 endpoint surface のみ利用。新 endpoint 追加・D1 schema 変更・Google Form 仕様変更は禁止。
2. **OKLch トークン正本化**: 色は `apps/web/src/styles/tokens.css`（task-09）と `specs/09b-design-tokens.md`（task-08）が正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。CI gate `verify-design-tokens`（task-18）で fail 判定。
3. **プロトタイプ正本順位**: `claude-design-prototype/` の primitives + tokens + rhythm を**デザイン言語の正本**とする。プロトタイプ未掲載画面（管理画面群・register・privacy・terms）も同じ primitives 群で構成し、新規 primitive を生やさない。
4. **D1 直接アクセス禁止**: 既存条件（`apps/web` から D1 binding 禁止）を継続。

### 正本順位（衝突時の優先度）

1. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
2. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-{1,2,3}/phase-N.md`
3. `docs/00-getting-started-manual/specs/*.md`
4. プロトタイプ（`claude-design-prototype/`）

> 既存 API endpoint surface と UI 期待 shape が乖離する場合は、API を変更せず UI 側に adapter 層を置く（phase-1 §3 末尾方針）。
```

**触らない範囲**: 既存の「スタック」「主要ディレクトリ」「フォーム固定値」「重要な不変条件」「ブランチ戦略」「Governance / CODEOWNERS」「開発環境セットアップ」「ワークツリー作成」「よく使うコマンド」「PR作成の完全自律フロー」「Claude Code 設定」「シークレット管理」「参照ドキュメント」セクションは一切編集しない。

### 5.2 docs/00-getting-started-manual/specs/00-overview.md（edit）

**追記位置**: ファイル末尾。既存の overview 構造を破壊しない形で「画面一覧と API mapping」の参照節を末尾に追加する。

**追記する文面**:

```markdown
---

## 画面一覧（19 routes）と API mapping

UI 実装スコープと API 接続マッピングは下記を正本とする:

- 全画面一覧と層分け: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- 画面 → API endpoint 詳細マッピング: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` §2
- スコープ拡張根拠 / 非ゴール: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md` §1〜§3

### 層別 routes 早見

- 公開（6）: `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`
- 会員（2）: `/login`, `/profile`
- 管理（8）: `/(admin)/admin`, `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}`
- 共通（3）: `error.tsx`, `not-found.tsx`, `loading.tsx`

### API 接続不変条件

- `apps/api/src/routes/` 配下の現行 endpoint のみ利用
- 新 endpoint 追加・D1 schema 変更・Google Form 仕様変更は本ワークフローでは禁止
- shape 乖離は UI 側 adapter で吸収（API を変更しない）
```

**触らない範囲**: 既存の overview 本文（システム構成・3 層モデル・データフロー等）は変更しない。

### 5.3 docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md（new）

新規作成。phase-1 §1〜§3 を後続 task が参照しやすい粒度に圧縮し、1 ファイルで完結させる。

**ファイル骨子**:

```markdown
# UI prototype alignment / MVP recovery — SCOPE

> 改訂日: 2026-05-07
> 正本: 本ファイル → `outputs/phase-{1,2,3}/phase-N.md` → `docs/00-getting-started-manual/specs/*.md` → プロトタイプ

## 1. 全画面実装スコープ（19 routes）

| 層 | route | プロトタイプ掲載 | 設計指針 |
|----|-------|-----------------|---------|
| 公開 | `/` | 有 | プロトタイプ忠実 |
| 公開 | `/(public)/members` | 有 | プロトタイプ忠実（密度切替追加） |
| 公開 | `/(public)/members/[id]` | 有 | プロトタイプ忠実 |
| 公開 | `/(public)/register` | 無 | デザイン言語ベース（Hero + CTA card） |
| 公開 | `/privacy` | 無 | デザイン言語ベース（LegalProse） |
| 公開 | `/terms` | 無 | デザイン言語ベース（LegalProse） |
| 会員 | `/login` | 有 | プロトタイプ忠実（5 状態） |
| 会員 | `/profile` | 有 | プロトタイプ忠実 |
| 管理 | `/(admin)/admin` | 有 | プロトタイプ忠実 |
| 管理 | `/(admin)/admin/members` | 部分 | DataTable + Drawer |
| 管理 | `/(admin)/admin/tags` | 無 | Queue + Detail |
| 管理 | `/(admin)/admin/meetings` | 無 | Calendar/List + Form |
| 管理 | `/(admin)/admin/schema` | 無 | Diff + Apply |
| 管理 | `/(admin)/admin/requests` | 無 | Queue + Detail + Action |
| 管理 | `/(admin)/admin/identity-conflicts` | 無 | Side-by-side compare |
| 管理 | `/(admin)/admin/audit` | 無 | Filter + Timeline |
| 共通 | `error.tsx` | 無 | ErrorState |
| 共通 | `not-found.tsx` | 無 | EmptyState |
| 共通 | `loading.tsx` | 無 | Skeleton |

## 2. API 接続マッピング要約

詳細 shape は `outputs/phase-3/phase-3.md` §2 を参照。

| 画面群 | 主要 endpoint |
|--------|--------------|
| 公開トップ | `GET /public/{stats,members,form-preview}` |
| 公開一覧 / 詳細 | `GET /public/members`, `GET /public/member-profile/:id` |
| 公開 register | 外部 redirect（`responderUrl`） |
| 会員 login | `POST /auth/magic-link`, `GET /auth/{gate-state,session-resolve,schemas}` |
| 会員 profile | `GET /me`, `GET /auth/schemas`, `POST /me/{visibility-request,delete-request}` |
| 管理 dashboard | `GET /admin/dashboard` |
| 管理 members | `GET /admin/members`, `POST /admin/{member-status,member-delete}`, `GET /admin/member-notes/:id` |
| 管理 tags | `GET /admin/tags-queue`, `POST /admin/tags-queue/:id/decision` |
| 管理 meetings | `GET/POST /admin/meetings`, `PATCH /admin/meetings/:id`, `GET /admin/attendance` |
| 管理 schema | `GET /admin/schema`, `POST /admin/{sync-schema,sync,responses-sync}` |
| 管理 requests | `GET /admin/requests`, `POST /admin/requests/:id/decision` |
| 管理 identity-conflicts | `GET /admin/identity-conflicts`, `POST /admin/identity-conflicts/:id/resolve` |
| 管理 audit | `GET /admin/audit` |
| 共通 error/404/loading | API call なし（Sentry capture のみ） |

## 3. 不変条件（task-02..22 共通）

1. 既存 API のみ接続（`apps/api/src/routes/` 配下のみ）
2. D1 schema / Google Form 仕様変更は禁止
3. OKLch トークン正本化（`tokens.css` + `specs/09b-design-tokens.md`）/ HEX 禁止
4. `apps/web` から D1 binding 禁止（既存条件）
5. 新 primitive を生やさない（task-10 で確定する 13 primitive 内で完結）
6. shape 乖離は UI 側 adapter で吸収

## 4. 正本順位

1. 本 SCOPE.md
2. `outputs/phase-{1,2,3}/phase-N.md`
3. `docs/00-getting-started-manual/specs/*.md`
4. `docs/00-getting-started-manual/claude-design-prototype/`

## 5. 後続タスク導線

| 責務 dir | tasks | 依存 |
|---------|-------|------|
| 02-runtime | task-02..05 | 本ゲート完了後 W2 |
| 03-spec-source | task-06..08 | 本ゲート完了後 W2 |
| 04-design-system | task-09, 10 | W3 / W4 |
| 05-screens-public | task-11, 12 | W5 |
| 06-screens-member | task-13, 14 | W5 |
| 07-screens-admin | task-15, 16, 17 | W5 |
| 08-regression | task-18 | W6 |

DAG 詳細は `outputs/phase-2/phase-2.md` §3。
```

### 5.4 副作用

- AI エージェント（Claude Code 等）が CLAUDE.md を毎セッション参照するため、19 routes スコープと 3 不変条件が以後の全タスクで自動適用される
- GitHub PR レビュー（solo）時に SCOPE.md 1 ファイル確認で全体像が掴める
- task-02..22 の各仕様書から SCOPE.md への相対パスリンクが張られる前提で工数見積されている（phase-2 §5）

---

## 6. テスト方針

コード変更がないため自動テストは存在しない。次の検証で代替する。

### 6.1 Markdown lint（自動）

- `pnpm lint`（リポジトリルート）または markdown-aware の lint タスクが存在する場合はそれを実行
- 検査項目: heading levels の連続性、broken link、list indent、code fence の閉じ忘れ

### 6.2 mapping 表の手動確認（目視）

- SCOPE.md §1 の 19 行と phase-1 §2.2 の 19 行が完全一致すること（route path / 掲載有無 / 設計指針）
- SCOPE.md §2 の endpoint 列と phase-3 §2 / §7（実在確認済み surface）に矛盾がないこと
- CLAUDE.md 追記内の 19 routes 列挙と SCOPE.md §1 の routes 列挙が一致

### 6.3 リンク到達性確認（手動）

```bash
# 相対リンク先がすべて存在することを確認
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md
ls docs/00-getting-started-manual/specs/00-overview.md
```

### 6.4 後続タスクの参照可能性確認

- task-02 仕様書ドラフト時に `[SCOPE.md](../SCOPE.md)` の相対パスが解決すること
- 同じく `[phase-3 §2](../outputs/phase-3/phase-3.md)` が解決すること

---

## 7. ローカル実行・検証コマンド

```bash
# 1. ファイル存在チェック
test -f CLAUDE.md \
  && test -f docs/00-getting-started-manual/specs/00-overview.md \
  && test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md \
  && echo "OK: all target files exist"

# 2. CLAUDE.md に「ui-prototype-alignment-mvp-recovery」セクションが存在
grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md

# 3. specs/00-overview.md に「19 routes」記述が存在
grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md

# 4. SCOPE.md が 19 routes を列挙している（行数 19 以上の `|` 行を期待）
grep -cE "^\| (公開|会員|管理|共通) \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md

# 5. markdown lint（プロジェクトに lint task がある場合）
mise exec -- pnpm lint

# 6. 後続タスクの相対パス解決確認（dry-run）
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md
```

---

## 8. DoD

- [ ] **CLAUDE.md** に「UI prototype alignment / MVP recovery」セクションが追記済（19 routes / 3 不変条件 / 正本順位）
- [ ] **`docs/00-getting-started-manual/specs/00-overview.md`** 末尾に「画面一覧（19 routes）と API mapping」節が追記済
- [ ] **`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`** が新規作成済（§1 routes 表 / §2 API mapping / §3 不変条件 / §4 正本順位 / §5 後続タスク導線）
- [ ] SCOPE.md §1 の 19 行と phase-1 §2.2 の 19 行が一致
- [ ] SCOPE.md §2 の endpoint 列と phase-3 §2 / §7 に矛盾なし
- [ ] mapping 表に欠落 route なし（19 = 6 + 2 + 8 + 3）
- [ ] 後続 task-02..22 から相対パス `../SCOPE.md` で参照可能
- [ ] `pnpm lint` が pass（または markdown lint のみでも可）
- [ ] `git diff --name-status` の変更範囲が正本 docs / task package / completed-tasks archive に限定され、apps/packages コード変更が 0 件

---

## 9. 補足（CONST_007 整合確認）

### 9.1 単一実装サイクル妥当性

本タスクは phase-2 §5 の工数見積で **0.25 人日** に位置付けられる先行ゲート。実工数として 0.5 人日（レビュー同期含む）に少しバッファを取っても、合計 ~14 人日の単一サイクル枠（CONST_007）には十分収まる。

### 9.2 単一責務原則（Clean Code / SRP）

本タスクが負う責務は「scope の文書化」のみ。次の責務には踏み込まない:

| 別タスクの責務 | task |
|---------------|------|
| UI/UX 契約書（状態表 / 遷移図） | task-06 |
| プロトタイプ → 本番 component mapping | task-07 |
| OKLch tokens 一覧 / fallback | task-08 |
| primitives 実装 | task-10 |
| 画面実装 | task-11..17 |
| CI gate（verify-design-tokens / Playwright smoke） | task-18 |

### 9.3 ファイル変更の最小性

正本 docs 3 ファイル（edit 2 / new 1）を主成果物とし、task package と completed-tasks archive rename は scope gate の evidence / hygiene として同一 PR に含める。apps/packages は触らず、CLAUDE.md は既存セクションを破壊せず追記のみとする。これにより W2 以降の参照基盤と archive 方針を同時に固定する。

### 9.4 後続タスクへの引き渡し

task-02..22 の各仕様書冒頭で `依存タスク: task-01` と明記し、`SCOPE.md` を正本参照させる運用を想定する。本タスクが未完了のままだと後続タスクは仕様書執筆段階で参照先がなくなるため、**必ず W1 単独で完了させてから W2 を起動する**。
