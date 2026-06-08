# Phase 2 — アーキテクチャ設計詳細

> **[実装区分: 実装仕様書]** / `implementation_mode: new` / **NON_VISUAL**
> topology / 責務境界 / 状態所有権 / count guard と orphan detection の責務分離を確定する。

## 1. topology（責務境界）

```
┌─────────────────────────────────────────────────────────────┐
│ apps/api（D1 直接アクセスはここに閉じる・invariant #5）          │
│                                                               │
│  routes/admin/tags.ts                                         │
│    GET /admin/tags/orphans  (read-only / 監査 surface)  ← 新規 │
│        │ requireAdmin（既存 middleware） → db(c) → repository  │
│        ▼                                                       │
│  repository/memberTags.ts                                     │
│    detectOrphanMemberTags(c): Promise<OrphanMemberTag[]> ← 新規│
│    countOrphanMemberTags(c): Promise<number>            ← 新規 │
│        │ SELECT ... WHERE tag_id NOT IN                       │
│        │              (SELECT tag_id FROM tag_definitions)     │
│        ▼                                                       │
│  D1: member_tags ⟕ tag_definitions（論理 FK・no DB FK）        │
│                                                               │
│  repository/tagDefinitions.ts（既存・非破壊）                  │
│    countMemberTagReferences(c, tagId)  ← 削除時 count guard    │
│        │ DELETE /tags/:tagId/physical の 409 防壁              │
└─────────────────────────────────────────────────────────────┘
        │
        ╳ apps/web は本タスクで非接触（invariant #5・UI 変更なし）
```

### レイヤ責務

| レイヤ | 責務 | 本タスクでの変更 |
|--------|------|------------------|
| route（`routes/admin/tags.ts`） | HTTP 入口・認証境界委譲・JSON 整形 | `GET /tags/orphans` 追加（read-only） |
| repository（`repository/memberTags.ts`） | D1 クエリ実行・行 → 型マッピング | `detectOrphanMemberTags` / `countOrphanMemberTags` / `OrphanMemberTag` 追加 |
| repository（`repository/tagDefinitions.ts`） | 削除時 count guard（既存） | 非破壊（変更なし・共存） |
| D1 schema | 永続化・no-FK 論理参照 | 変更なし（migration ゼロ） |

## 2. 状態所有権

| 対象 | 所有者 | 本タスクの操作 |
|------|--------|----------------|
| `member_tags` 行 | `assign*` 4 関数（write 経路・invariant #13） | **read のみ**（所有権を変更しない） |
| `tag_definitions` 行 | tag 定義 CRUD（既存） | **read のみ**（サブクエリ参照） |
| 孤児検出結果 | 揮発（クエリ結果・永続化しない） | endpoint レスポンス・テスト assertion に使用 |

→ orphan detection は **read-only**。member_tags / tag_definitions の所有権・状態を一切変更しない。mutation を持たないため invariant #13（write は `assign*` 限定）に抵触しない。

## 3. count guard と orphan detection の責務分離（AC-4）

| 観点 | count guard（issue-1070・既存） | orphan detection（本タスク・新規） |
|------|--------------------------------|------------------------------------|
| 関数 / endpoint | `countMemberTagReferences(c, tagId)` | `detectOrphanMemberTags(c)` / `countOrphanMemberTags(c)` / `GET /admin/tags/orphans` |
| クエリ方向 | tag → 被参照 `member_tags` 数（`WHERE tag_id = ?`） | `member_tags` → 不在 `tag_definitions`（`WHERE tag_id NOT IN (...)`） |
| 問い | 「この tag を参照している member_tags は何件あるか」 | 「定義の無い tag を参照している member_tags はどれか」 |
| タイミング | tag physical delete の**直前** | 任意（監査 endpoint / テスト不変条件） |
| 役割 | 参照あり tag の削除を 409 で拒否（孤児の**発生防止**） | 既に存在する孤児行の**検出・可視化** |
| 副作用 | なし（read・判定用 COUNT） | なし（read-only） |
| 撤去/代替か | **撤去しない・維持** | count guard を代替**しない**・補完 |

### 防止 ⇄ 検出の補完関係（二段防壁）

```
[防止層] count guard（削除時 409）
   │  参照あり tag を消させない → 削除起因の孤児発生を抑制
   ▼
[検出層] orphan detection（任意の監査）
   │  既に存在する孤児（過去 INSERT / fixture / 他経路由来）を可視化
   ▼
admin が手動で解消（解消 mutation は本タスク範囲外）
```

- 防止（count guard）= 新規孤児の発生を入口で抑える。
- 検出（orphan detection）= 既にできた孤児を出口で見つける。
- 両者は**方向が逆**であり、撤去・代替ではなく **二段防壁**として共存する。

## 4. システムループ（因果構造）

| ループ種別 | 経路 | 効果 |
|------------|------|------|
| 強化ループ | orphan detection が可視化 → admin が孤児を手動解消 → 整合性向上 | 整合性が回復方向へ（解消 mutation は範囲外＝検出までが本タスク） |
| バランスループ | count guard（削除時防止）→ 新規孤児発生を抑制 → orphan detection の検出対象が増えない | 孤児の累積を抑える |

## 5. 認証・エラー境界

| 境界 | 委譲先 | 本タスクの追加 |
|------|--------|----------------|
| admin 認証 | 既存 `requireAdmin` 系 middleware（`routes/admin/*` 共通） | なし（既存境界を踏襲） |
| D1 エラー | 既存共通エラーハンドラ | なし（委譲のみ） |
| 入力検証 | endpoint は入力パラメータなし | 検証不要（クエリパラメータ・body なし） |

## 6. 変更対象ファイル一覧（確定）

| ファイル | 変更種別 | 内容 |
|----------|----------|------|
| `apps/api/src/repository/memberTags.ts` | 編集 | `OrphanMemberTag` 型 + `detectOrphanMemberTags` + `countOrphanMemberTags` 追加 |
| `apps/api/src/routes/admin/tags.ts` | 編集 | `GET /tags/orphans` endpoint + import 追加 |
| `apps/api/src/repository/__tests__/memberTags.orphan.repository.spec.ts` | 新規 | orphan detection repository spec |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | 編集 | `GET /admin/tags/orphans` contract test 追加 |
| `apps/api/src/routes/admin/members.contract.spec.ts` | 確認のみ | `tag_a`/`tag_b` は既に `tag_definitions` 定義済み（fixture 健全性確認・AC-5） |

> `*.spec.ts` のみ使用（invariant #8）。`memberTags.readonly.test-d.ts` は `.test-d.ts` 拡張で型 typecheck 用・編集なし（typecheck green 確認のみ）。

## 完了条件（Phase 2 — アーキテクチャ）

- [x] topology / レイヤ責務を確定
- [x] 状態所有権（read-only・mutation ゼロ）を確定
- [x] count guard と orphan detection の責務分離テーブルを明記（AC-4）
- [x] 二段防壁の補完関係・システムループを整理
- [x] 変更対象ファイル一覧を確定
