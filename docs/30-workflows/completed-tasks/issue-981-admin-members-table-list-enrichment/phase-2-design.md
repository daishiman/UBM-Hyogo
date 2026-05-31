# Phase 2: 設計

> workflow: `issue-981-admin-members-table-list-enrichment`

## 1. 既存コンポーネント再利用可否（[FB-SDK-07-1] 必須）

| 必要部品 | 既存再利用 | 判定 |
| --- | --- | --- |
| chip 描画 | `apps/web/src/components/ui/Chip.tsx`（`tone` / `dot` props） | ✅ 再利用。新規作成しない |
| zone → tone | `apps/web/src/lib/tones.ts` `zoneTone(zone: string): ChipTone` | ✅ 再利用 |
| membershipType → tone | `apps/web/src/lib/tones.ts` `statusTone(status: string): ChipTone` | ✅ 再利用 |
| chip 行レイアウト | `flex flex-wrap gap-1.5`（`MemberStateChip.tsx` 準拠） | ✅ 既存クラス流用 |
| publish/退会 chip | `MemberStateChipRow`（既存・維持） | ✅ 既存維持 |

> **結論**: 新規 UI primitive ゼロ。`MembersTable.tsx` 内の描画追加と既存 helper 参照のみで AC を満たす。新規 chip コンポーネントを作らない（不変条件 #3・#4）。

## 2. table 列マッピング（プロトタイプ整合）

プロトタイプ `pages-admin.jsx` L223-276 と現 `MembersTable` の差分を解消する。

| 列 | プロトタイプ | 現状 | 本タスクの変更 |
| --- | --- | --- | --- |
| メンバー | name + occupation(small) | name のみ | **occupation 追加**（氏名 button 下に small text、存在時のみ） |
| メール | masked | masked | 変更なし |
| 区画 / ステータス | zone chip + type chip | ヘッダ「ステータス」/ publishState chip のみ | **ヘッダ→「区画 / ステータス」** + zone chip + type chip 追加。既存 `MemberStateChipRow`（publishState/退会）は維持 |
| タグ | tag pills / 未タグ | placeholder「—」 | **tag pill 描画へ置換** |
| 最終更新 | mono | mono | 変更なし |
| 公開 | Switch | `MemberPublishSwitch` | 変更なし |
| 操作 | edit pencil | edit pencil | 変更なし |

### 設計判断: 「区画 / ステータス」列の chip 構成

- **採用案（Option A・additive・推奨）**: 既存 `MemberStateChipRow`（publishState=public/member_only/hidden、退会）を**維持**しつつ、その前に zone chip + type chip を追加する。
  - 理由: 当アプリの `publishState` は 3 値（`public`/`member_only`/`hidden`）でプロトタイプの binary switch では表現しきれない情報量。publishState chip を削ると `member_only`/`hidden` 区別が list から失われる。additive にすることで info parity を維持しつつ AC-2b を満たし、回帰リスクを最小化する。
- **不採用案（Option B）**: publishState chip を削除しプロトタイプの 2 chip（zone/type）に厳密一致。→ member_only/hidden 情報欠落のため不採用。

描画順序（左→右、`flex flex-wrap gap-1.5` 内）:
1. zone chip（`m.ubmZone` 存在時）
2. type chip（`m.ubmMembershipType` 存在時）
3. `<MemberStateChipRow publishState isDeleted />`（既存・常時）

> zone/membershipType は **raw 値描画**（プロトタイプ L247-248 も `{m.ubmZone}` / `{m.ubmMembershipType}` を raw 描画）。人間可読ラベル辞書化は本スコープ外（Phase 12 で未タスク候補判定）。

## 3. chip 描画ロジック（疑似コード）

```tsx
// 区画 / ステータス 列セル
<td className="px-3 py-2">
  <div className="flex flex-wrap gap-1.5">
    {m.ubmZone ? <Chip tone={zoneTone(m.ubmZone)} dot>{m.ubmZone}</Chip> : null}
    {m.ubmMembershipType ? <Chip tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</Chip> : null}
    <MemberStateChipRow publishState={m.publishState} isDeleted={m.isDeleted} />
  </div>
</td>

// タグ 列セル（placeholder「—」を置換）
<td className="px-3 py-2">
  {m.tags && m.tags.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {m.tags.slice(0, 2).map((t) => <Chip key={t.code}>{t.label}</Chip>)}
      {m.tags.length > 2 ? <Chip>{`+${m.tags.length - 2}`}</Chip> : null}
    </div>
  ) : (
    <Chip tone="warning" dot>未タグ</Chip>
  )}
</td>

// メンバー 列セル（氏名 button 下に occupation 追加）
<div className="flex flex-col">
  <button type="button" /* 既存 */>{m.fullName}</button>
  {m.occupation ? (
    <span className="text-xs text-[var(--ubm-color-text-muted)]">{m.occupation}</span>
  ) : null}
</div>
```

- `key` は `t.code`（tags は `{code,label}`、code が一意）。
- 「未タグ」chip は `tone="warning"`（`ChipTone` に存在。プロトタイプ `tone="warn"` 相当）。
- 全要素 **存在時のみ描画**（undefined/null は要素ごと省略。空 chip やダッシュを残さない）。

## 4. 入力・出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `MembersTableProps.items: ReadonlyArray<AdminMemberListView["members"][number]>`（既存。`occupation`/`ubmZone`/`ubmMembershipType`/`tags` は型上 optional 既存） |
| 出力 | DOM（追加された chip / occupation text）。戻り値型・props は不変 |
| 副作用 | なし（純描画）。tag pill は onClick handler を持たない（AC-4） |
| 状態所有権 | 行データは props で受領（read-only）。`MembersTable` は表示専用 component。state ownership は親 `MembersClientShell` のまま不変 |

## 5. 因果ループ / 境界

- バランスループ: list 行に情報を増やす ↔ 横幅・可読性。→ tag pill を最大2件 + `+N` に制限し情報密度を制御（プロトタイプ準拠）。
- 責務境界: データ取得（API/schema・変更禁止）⇔ 描画（`MembersTable`・本スコープ）。本タスクは描画層に閉じ、データ層・filter/pagination ロジックに触れない。

## 6. Props vs internal state（[VSCPKR-03]）

- 本変更で操作する値（occupation/zone/type/tags）は**すべて external props**（`items` 経由）。internal state（`useState`）は追加しない。Phase 4 のテストは props 注入のみで RED→GREEN を回せる。

## 7. design token 整合

- 追加クラスは `text-xs text-[var(--ubm-color-text-muted)]`（occupation）と既存 `flex flex-wrap gap-1.5`（chip 行）のみ。chip の色は `Chip` の `data-tone` → `ui-chip` CSS が tokens.css で解決。**HEX 直書きゼロ**（不変条件 #2）。

## 完了条件

- [ ] 既存部品再利用可否が判定された（新規 primitive ゼロ）
- [ ] table 列マッピングとヘッダ整合が確定した
- [ ] chip 描画ロジック（疑似コード）が固定された
- [ ] props/state 区別・state ownership・design token 整合が記録された
</content>
