# shell-collapse-cookie 設計doc↔実装の命名ドリフト整合 - タスク指示書

```yaml
issue_number: 1065
task_id: issue-1024-followup-002-shell-collapse-cookie-doc-naming-drift-reconciliation
task_name: shell-collapse-cookie 設計doc↔実装の命名ドリフト整合
category: ドキュメント
target_feature: apps/web/src/components/shell/shell-collapse-cookie.ts と issue-1024 設計ドキュメント
priority: 低
scale: 小規模
status: 未実施
source_phase: issue-1024-sidebar-collapse-cookie-persistence 2回目独立検証
created_date: 2026-05-31
dependencies: [issue-1024-sidebar-collapse-cookie-persistence]
```

## メタ情報

| 項目         | 内容                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| タスクID     | issue-1024-followup-002-shell-collapse-cookie-doc-naming-drift-reconciliation                          |
| タスク名     | `shell-collapse-cookie.ts` の設計ドキュメント記載名と実装 export 名のドリフトを整合する                |
| 分類         | ドキュメント整合 / API 命名ポリシー                                                                    |
| 対象機能     | `apps/web/src/components/shell/shell-collapse-cookie.ts` と issue-1024 の設計ドキュメント群            |
| 優先度       | 低                                                                                                    |
| 見積もり規模 | 小規模                                                                                                |
| ステータス   | spec_created（未着手・実装/commit/PR は user-gated）                                                   |
| 発見元       | issue-1024-sidebar-collapse-cookie-persistence 2回目独立検証（命名ドリフト検出）                       |
| 発見日       | 2026-05-31                                                                                            |
| GitHub Issue | [#1065](https://github.com/daishiman/UBM-Hyogo/issues/1065)                                            |

## 親 / 関連 workflow

- 起点 workflow: `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/`（移動後 path）
- 対象ドキュメント: `.../phase-2-design.md` / `.../phase-3-design-review.md` / `.../outputs/phase-12/implementation-guide.md`
- 対象実装: `apps/web/src/components/shell/shell-collapse-cookie.ts`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

issue-1024 の設計ドキュメント（phase-2-design.md / implementation-guide.md）は cookie I/O の API 名を以下で記述している:

- 定数: `SHELL_COLLAPSE_COOKIE`
- parser: `readCollapsedFromCookieString(value)`（cookie **値**を受け取る）
- client read: `readCollapsedFromDocument()`
- client write: `writeCollapsedCookie(collapsed)`

しかし実装 `shell-collapse-cookie.ts` は、これらとは別に **primary（主）API** として以下を export し、ドキュメント記載名を**互換 wrapper / alias** として併存させている（実測）:

- 定数: `SHELL_COLLAPSE_COOKIE_NAME` を主、`SHELL_COLLAPSE_COOKIE` を alias
- parser: `parseShellCollapsedCookie(rawCookieHeader)`（cookie **ヘッダ全体**を受け取る）を主、`readCollapsedFromCookieString(value)`（値を受け取る）を別 export として併存
- client read: `readShellCollapsedFromDocument()` を主、`readCollapsedFromDocument()` を alias
- client write: `writeShellCollapsedCookie(collapsed)` を主、`writeCollapsedCookie(collapsed)` を alias

### 1.2 問題点・課題

- **ドキュメントと実装の正本名が食い違う**。後続実装者がドキュメントの `readCollapsedFromCookieString` を「正本 parser」と読むが、実装の主 parser は `parseShellCollapsedCookie`（引数も「値」vs「ヘッダ全体」で異なる）。誤用すると parse 対象を取り違える。
- 1 概念あたり 2 export（計 8 export / 約 4 概念）で **冗長**。alias が dead code でないかの判断材料が散らばる。
- 機能上は実装が doc 記載 API を superset として含む（alias 再 export）ため**バグや欠落ではない**が、SSOT（命名の単一正本）が崩れている。

### 1.3 放置した場合の影響

- 後続 follow-up（例: issue-1024-followup-001 Secure 化）が、どちらの命名を正本に拡張すべきか迷う。
- 設計ドキュメントを参照する将来タスクが陳腐化した API 名で実装を書き、レビュー往復が増える。

---

## 2. 何を達成するか（What）

### 2.1 目的

`shell-collapse-cookie.ts` の **正本 API 名を 1 系統に確定**し、設計ドキュメント（phase-2-design / implementation-guide）を実装の正本名へ追従させる。冗長な alias の扱い（残す / 削除）も明文化する。

### 2.2 最終ゴール

- 正本命名を確定（推奨: 実装の `*Shell*` 系を正本とし、`parseShellCollapsedCookie`=ヘッダ全体 parser を主 parser とする）。
- ドキュメント（phase-2-design.md / implementation-guide.md）のコードブロック・API 表が実装の正本名と一致する。
- alias（`readCollapsedFromCookieString` / `writeCollapsedCookie` / `readCollapsedFromDocument` / `SHELL_COLLAPSE_COOKIE`）について「互換目的で残す」か「未参照なら削除」かを決定し記録する。
- 参照箇所（`useSidebarState.ts` / `SidebarShell.server.tsx`）が正本名を使うことを確認（または正本名へ寄せる）。

### 2.3 スコープ

#### 含むもの（既定: docs-only）

- `phase-2-design.md` / `phase-3-design-review.md` / `outputs/phase-12/implementation-guide.md` の API 名・引数説明を実装の正本名へ更新。
- API 命名ポリシー（正本 vs alias）の明文化（implementation-guide に「正本 / 互換」表を追加）。

#### 含む可能性があるもの（任意・要判断）

- alias export が `apps/web/src` 内で未参照と確認できた場合の **冗長 export 削除**（この場合のみコード変更を伴う。`grep` で参照 0 を確認してから）。削除する場合は focused Vitest の alias 参照も更新する。

#### 含まないもの

- cookie 名・value・属性の変更（issue-1024 不変条件 I-6 維持）。
- 永続化 / SSR seed の振る舞い変更。
- API endpoint / D1 / Google Form 仕様変更。

### 2.4 成果物

- 設計ドキュメント 3 本の命名整合差分（docs-only）。
- （任意）冗長 alias 削除のコード差分 + テスト更新。
- 本 follow-up を consumed に更新する記録。

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 「正本はどちらか」の決定が本質

実装は `parseShellCollapsedCookie`（ヘッダ全体）と `readCollapsedFromCookieString`（値のみ）の**両方**を持つが、これは alias ではなく**引数契約が異なる別関数**。ドキュメントを追従させる前に「どちらを正本 parser とするか」を先に決めないと、整合先がぶれる。推奨は server 側で `cookies().get(name)?.value` を渡すなら値 parser、`document.cookie` 全体を渡すならヘッダ parser、という**呼出側の入力形に応じた使い分け**を明示すること（両方残す合理性がある）。

### 3.2 alias 削除の安全確認（コード変更を伴う場合）

alias を削除する場合、`apps/web/src` 全体 + テストでの参照を grep で 0 件確認してからにする。issue-1024 のテストは doc 記載名（`writeCollapsedCookie` 等）を直接 assert している可能性があり、削除すると test が落ちる。**まず docs-only で整合 → 削除は別判断**が安全（本タスクの既定を docs-only にした理由）。

### 3.3 CONST_004（docs-only か実装か）の区分

本タスクは既定 docs-only（CONST_004 例外）。ただし alias 削除に踏み込むと実装区分に変わる。Issue / 仕様書では「既定 docs-only、alias 削除は任意サブ判断」と明記し、スコープ膨張を防ぐこと。

### 3.4 後続実装者向けの落とし穴メモ

- `parseShellCollapsedCookie` と `readCollapsedFromCookieString` は**引数が違う**（ヘッダ全体 vs 値）。名前の似た方を雰囲気で選ばない。
- ドキュメントだけ直して実装の alias を残す場合、「なぜ 2 系統あるか」を implementation-guide に必ず残す（次の人が再び drift と誤認しないため）。

---

## 4. 受入条件 (AC)

- **AC-1**: `phase-2-design.md` / `implementation-guide.md` のコードブロック・API 表が実装 `shell-collapse-cookie.ts` の正本 export 名と一致する。
- **AC-2**: implementation-guide に「正本 API / 互換 alias」の対応表と、`parseShellCollapsedCookie`（ヘッダ）vs `readCollapsedFromCookieString`（値）の使い分けが明記される。
- **AC-3**: alias の扱い（残す / 削除）の決定が記録される。削除する場合は `apps/web/src` + テストで参照 0 を確認済み。
- **AC-4**: docs-only の場合はコード差分 0。alias 削除に踏み込む場合のみ `pnpm typecheck` / `pnpm lint` / focused Vitest が green。
- **AC-5**: cookie 名 / value / 属性 / 永続化挙動は無変更（issue-1024 I-6 維持）。

---

## 5. 参照資料

- `apps/web/src/components/shell/shell-collapse-cookie.ts` — 実装（8 export の実態。正本確定の対象）
- `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/phase-2-design.md` — 設計ドキュメント（doc 記載名の起点）
- `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/implementation-guide.md` — 実装ガイド（API 表の整合対象）
- issue-1024 不変条件 I-2（state owner 単一）/ I-6（cookie 属性）
- CLAUDE.md「重要な不変条件」/ UI prototype alignment 不変条件（既存 API のみ・新規 primitive を生やさない）

---

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260531-153630-wt-4/apps/web/src/components/shell/shell-collapse-cookie.ts`
- 症状: `parseShellCollapsedCookie(rawCookieHeader)` と `readCollapsedFromCookieString(value)` は単純 alias ではなく、入力契約が「cookie ヘッダ全体」か「cookie 値のみ」かで異なる。命名だけを一括置換すると server/client の入力形を取り違える。
- 参照: `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/phase-2-design.md` / `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 実装 export 名へ doc を寄せる過程で、値 parser とヘッダ parser の契約差を消してしまう | API 対応表を「正本名 / 入力 / 使用箇所 / 互換 alias」の列で作成し、`parseShellCollapsedCookie` と `readCollapsedFromCookieString` を同義として扱わない |
| alias 削除に踏み込み、テストや外部参照を壊す | 既定は docs-only とする。削除する場合は `rg "SHELL_COLLAPSE_COOKIE|readCollapsedFromCookieString|readCollapsedFromDocument|writeCollapsedCookie" apps/web/src` で参照 0 を確認してから別途実装扱いに切り替える |
| completed workflow 配下の設計 doc だけを直し、Issue / unassigned-task / implementation-guide の説明が再び drift する | 変更対象を `phase-2-design.md`、`phase-3-design-review.md`、`outputs/phase-12/implementation-guide.md`、本仕様書の consumed trace に固定し、Phase 12 documentation changelog へ記録する |

## 検証方法

### 単体検証

```bash
rg -n "SHELL_COLLAPSE_COOKIE|SHELL_COLLAPSE_COOKIE_NAME|parseShellCollapsedCookie|readCollapsedFromCookieString|readShellCollapsedFromDocument|readCollapsedFromDocument|writeShellCollapsedCookie|writeCollapsedCookie" \
  docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence \
  apps/web/src/components/shell
```

期待: 設計 doc と implementation-guide が、実装の正本 API と互換 alias の関係を同じ表現で説明している。

### 統合検証

```bash
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web lint
mise exec -- pnpm --filter @repo/web test:run apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
```

期待: docs-only の場合は code diff なしで grep 整合が PASS。alias 削除に踏み込む場合のみ typecheck / lint / focused Vitest も PASS。

## スコープ

### 含む

- `phase-2-design.md` / `phase-3-design-review.md` / `outputs/phase-12/implementation-guide.md` の API 名・入力契約説明を実装と整合させる。
- 正本 API と互換 alias の扱いを明文化する。
- alias を残すか削除するかの判断と根拠を記録する。

### 含まない

- cookie 名・value・属性・SSR seed・hydration 挙動の変更。
- API / D1 / Google Form 仕様変更。
- alias 削除を必須化すること。削除は参照 0 が確認できた場合の任意サブ判断に留める。
