# Admin Identity Conflicts Clarity FU-001 — 重複候補行の内部 member_id 完全隠蔽 - タスク指示書

## メタ情報

```yaml
issue_number: 1224
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-clarity-and-meetings-rename-followup-001-member-id-full-redaction |
| タスク名 | 重複候補行の内部 member_id を主表示から退避し完全隠蔽する (M-1) |
| 分類 | 改善 |
| 補足分類 | UX 改善（非エンジニア向け） |
| 対象機能 | `/admin/identity-conflicts` 重複候補行の内部ID露出 |
| 優先度 | 低 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| GitHub Issue | #1224 |
| 発見元 | `admin-identity-conflicts-clarity-and-meetings-rename` Phase 3 design-review M-1 / Phase 12 unassigned-task-detection baseline |
| 発見日 | 2026-06-12 |
| canonical source | `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`/admin/identity-conflicts`（会員の重複確認）は、Google Form の実回答から推定される「同一人物の可能性がある2件の登録」を、管理者が「統合する」「別人として確定する」のいずれかで裁く画面である。親タスク `admin-identity-conflicts-clarity-and-meetings-rename` では、行の役割ラベルを日本語化（「新しい登録」「まとめ先（以前の登録）」を badge 化）し、`conflictId`（照合キー）を `<details>`（技術情報）へ退避するところまでを実装した。

しかし、`IdentityConflictRow.tsx` の重複候補行では、内部 member_id（例: `TEST-MEM-21`）が依然として `font-mono` で行の主表示に並んでいる（`item.sourceMemberId` と `item.candidateTargetMemberId`）。これは親タスクの段階では「ラベル日本語化」スコープに収まらず、行 UX の再設計を伴うため保留された。

### 1.2 問題点・課題

- 内部 member_id は非エンジニア管理者にとって意味を持たない内部キーであり、氏名・職業のような実体情報より視覚的に目立っている。
- 親タスクで `conflictId` は `<details>` 退避済みだが、member_id 自体は role badge の直後に `font-mono` で主表示されたままで、退避が不揃いになっている。
- 「どちらの登録を統合するか／別人とするか」の判断は、本来は氏名・職業・メールといった実体情報を根拠に行うべきだが、内部キーが目立つことで判断の焦点がぼやける。

### 1.3 放置した場合の影響

- 機能上の問題はないが、非エンジニア管理者が内部キーを「何かの意味がある値」と誤認し、判断材料として参照してしまう余地が残る。
- 親タスクで `conflictId` のみ退避し member_id を残したままだと、技術情報の隠蔽方針が中途半端になり、後続の行 UX 改善時に「なぜ member_id だけ露出しているのか」を再確認するコストが発生する。

---

## 2. 何を達成するか（What）

### 2.1 目的

重複候補行の主表示を氏名・職業などの実体情報に寄せ、内部 member_id を `<details>`（技術情報）または `title` / `aria` 補助へ退避することで、非エンジニア管理者が実体情報を根拠に統合／別人判定できるようにする。

### 2.2 最終ゴール

- 行の主表示には member_id を `font-mono` で並べない。
- member_id は `conflictId` と同じ `<details>`（技術情報）配下、または補助属性へ退避する。
- 統合／別人判定の操作キーとしての member_id は内部 state に保持し、merge / dismiss の mutation payload（`targetMemberId` 等）は不変にする。
- role badge（「新しい登録」「まとめ先（以前の登録）」）は引き続き表示し、どちらの登録かは実体情報で識別できるようにする。

### 2.3 受け入れ基準

- [ ] 重複候補行の主表示に member_id が `font-mono` で並ばない（`sourceMemberId` / `candidateTargetMemberId` の主表示露出を退避する）。
- [ ] member_id は `<details>`（技術情報）配下、または `title` / `aria` 補助属性へ退避され、必要時に参照できる。
- [ ] merge / dismiss の mutation payload（`targetMemberId` 等）と API レスポンス shape は不変。
- [ ] role badge（source / target）と一致項目・メール（masked）の表示は維持される。
- [ ] 既存の aria 属性・role・data-state など a11y 関連が喪失しない。
- [ ] 色は `var(--ubm-color-*)` のみで、HEX 直書き / inline style を追加しない。

### 2.4 スコープ概要

- 対象は `apps/web/src/components/admin/IdentityConflictRow.tsx` の表現層のみ。
- member_id の「表示退避」と、それに伴う行内レイアウト（主表示の再構成）に限定する。
- 行クリック／選択 UX の本格的な再設計は本タスクでは最小に留め、member_id の露出退避を主目的とする。

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | member_id の主表示退避 / `<details>` または補助属性への移動 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | member_id が主表示から退避されたこと / mutation payload 不変の test |
| `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts` | role ラベル等の用語 SSOT（参照のみ・必要時拡張） |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 退避後の行表示の visual evidence |

### 3.2 実装方針

- 現状の主表示（`IdentityConflictRow.tsx` L172-184 付近）で role badge 直後に並ぶ `<span className="font-mono">{item.sourceMemberId}</span>` / `{item.candidateTargetMemberId}` を、`conflictId` を退避している既存 `<details>`（L168-171 付近）配下へ移すか、別の技術情報セクションへ集約する。
- member_id は内部 state（merge payload の `targetMemberId` 等）として引き続き保持し、`onMerge` / `onDismiss` の trigger payload は変更しない。
- 主表示には role badge と実体情報（一致項目・メール masked）を残し、「どちらの登録か」を実体で識別できる構成にする。
- 退避先を `title` / `aria` 補助にする場合は、視覚的に消しつつスクリーンリーダー／hover で参照可能にし、a11y を後退させない。
- 新規 design token を増やさず、既存 `var(--ubm-color-*)` / `font-mono` utility / `<details>` パターンを再利用する。

---

## 苦戦箇所【記入必須】

- 対象: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- 知見1（操作キーとの二重性）: member_id は単なる表示値ではなく、「どの登録を source / target として統合・別人判定するか」を決める**操作キー**でもある。`onMerge` は `targetMemberId: item.candidateTargetMemberId` を payload に渡している（L116 付近）。したがって member_id を画面から完全に消すのではなく、**内部 state には保持したまま UI 露出だけを減らす**必要がある。これが行のクリック／選択 UX と state 設計の再考を伴うため、親タスクのラベル日本語化だけでは閉じず、独立スコープになった。
- 知見2（`<details>` パターンの再利用と線引き）: `conflictId` は親タスクで既に `<details>`（技術情報）へ退避済み（L168-171 付近）。同じ `<details>` パターンを member_id にも適用できる。ただし、統合確認ダイアログ（`stage === "merge-confirm"` / `"merge-final"`）の中では、管理者が「本当にこの2件か」を人間が照合する場面が残り得るため、**どこまで隠すか（行の主表示からは退避、確認ダイアログ内では参照可能に残すか）の線引き判断**が必要になる。
- 知見3（a11y と masked 値の整合）: メールは `responseEmailMasked` として既に masked 表示されている（L187 付近）。member_id を退避する際も、既存の `aria` / `role` / `data-state` を壊さず、退避先で参照性（hover / SR）を担保すること。

---

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| member_id を主表示から消す際に merge / dismiss の payload まで変更してしまう | 高 | `onMerge` / `onDismiss` の trigger payload（`targetMemberId` 等）を変更しない test を追加し、mutation contract 不変を保証する |
| `<details>` 退避で a11y 属性（aria / role）が喪失する | 中 | 退避前後で aria 属性・role・data-state を assert する unit test を追加する |
| 確認ダイアログ内の人間照合手段まで奪い、統合判断ができなくなる | 中 | 行の主表示からのみ退避し、確認ダイアログ内では member_id を参照可能に残すか線引きを設計に明記する |
| UI token を直接色指定して design token gate に抵触する | 低 | 既存 `var(--ubm-color-*)` / utility の範囲に限定し、HEX 直書き / inline style を避ける |

---

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

期待: member_id が主表示から退避されたこと、`<details>` または補助属性で参照可能なこと、merge / dismiss payload 不変、a11y 属性維持の assertion が PASS。

### 統合検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium
```

期待: 退避後の重複候補行で member_id が主表示に並ばず、role badge と実体情報が視認でき、統合／別人確定フローが従来通り完了する。

### 静的検証

```bash
rg -n "#[0-9a-fA-F]{3,8}|style=\\{\\{" apps/web/src/components/admin/IdentityConflictRow.tsx
```

期待: 退避に伴う HEX 直書き / inline style の追加がない。

---

## スコープ

### 含む

- 重複候補行の主表示からの内部 member_id 退避（`<details>` または補助属性化）。
- 退避に伴う行内レイアウト（主表示の再構成）。
- member_id を操作キーとして内部 state に保持する設計。
- focused unit / Playwright evidence の更新。

### 含まない

- API / D1 schema / shared schema の変更。
- merge / dismiss の mutation contract（payload / レスポンス shape）変更。
- 行クリック／選択 UX の本格的な再設計（member_id 露出退避を超える範囲）。
- 親タスクで完了済みの role ラベル日本語化・`conflictId` の `<details>` 退避（実装済み）。
- production / staging deploy、commit、push、PR、Issue close。

---

## 関連リソース

- 親 workflow: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/`
- Phase 12 実装ガイド: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/implementation-guide.md`
- 未タスク検出: `docs/30-workflows/completed-tasks/admin-identity-conflicts-clarity-and-meetings-rename/outputs/phase-12/unassigned-task-detection.md`
- 対象 component: `apps/web/src/components/admin/IdentityConflictRow.tsx`
