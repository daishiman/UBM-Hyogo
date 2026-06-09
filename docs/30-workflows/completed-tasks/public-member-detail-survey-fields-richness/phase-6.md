# Phase 6: テスト拡充

## 0. 目的

Phase 4（happy path 中心の RED）を補完し、fail path / 境界 / 回帰 guard を追加する。既存 spec が壊れていないことの回帰確認と、props 形状変更（MemberLinks）に伴う同 wave 更新を含む。

実行コマンドは Phase 4 / Phase 5 §5 と同一（targeted vitest, `--root=../.. --config=vitest.config.ts`）。

---

## 1. fail path / エッジケース追加（Phase 2 §8 由来）

### 1.1 adapter（`member-detail.spec.ts` 追加）

| TC | ケース | 入力 | 期待 |
| -- | ------ | ---- | ---- |
| TC-A-20 | publicSections 空（再掲強化） | `publicSections: []` | hero=summary のみ / business 全 "" / personal 4 行全 "—" / message="" / links=[] / other=[]。throw しない |
| TC-A-21 | hometown 不在で空 | basic_profile に hometown 無し | `hero.hometown === ""`（TC-A-03 の補強。other にも漏れない） |
| TC-A-22 | selfIntroduction 不在 | message field 無し | `message === ""` |
| TC-A-23 | url 値が空文字 | url kind value="" | `links` に含まれない（TC-A-11 補強） |
| TC-A-24 | url 値が空白のみ | url kind value="   "（空白 3 文字） | 実装方針に合わせ assert（trim して空なら除外、しないなら href にそのまま）。Phase 5 の `String(value)` 非空判定に一致させる |
| TC-A-25 | 未知 kind を other に流さない | kind="weird" | `other` に当該 field を含まない（skip 済み） |
| TC-A-26 | business 部分欠損 | skills のみ、businessOverview/canProvide 無し | `business.skills` 値あり、他 2 つ "" |
| TC-A-27 | personal 全欠損 | personal 4 キーいずれも無し | personal 4 行全て value="—"、順序固定 |
| TC-A-28 | 複数 url field | urlWebsite + urlX 両方非空 | links 2 件、stableKey 一意、入力順保持 |
| TC-A-29 | other 複数セクション | 固定割当外 field が 2 section に分散 | other が section 構造を保持（key/title） |

### 1.2 component fail path

| TC | 対象 | ケース | 期待 |
| -- | ---- | ------ | ---- |
| TC-B-09 | BusinessOverviewSection | 全空（businessOverview/skills/canProvide すべて ""） | 本文 "—"、skills/canProvide ブロック非表示、section 自体は描画（eyebrow + 見出しは残る） |
| TC-P-07 | PersonalSection | rows=[]（理論上 adapter は 4 行渡すが防御） | `.kv-row` 0 件でも throw しない |
| TC-M-06 | MessageCard | message が空白のみ "   "（3 文字） | 実装方針（`!message` は falsy 判定で空白は truthy）に従い assert。空白を非表示にするなら adapter 側 trim を明記し合わせる |
| TC-H-05 | ProfileHero | summary 全空 + hometown="" | h1 空、chip 全非表示でも throw しない |

> TC-M-06 / TC-A-24 は「空白のみ」の扱いを Phase 5 実装と一致させる。実装が `String(value)` の非空判定（`value !== ""`）なら空白は通過する。本タスクは厳密 trim を要求しないため、テストは実装挙動に合わせて 1 通りに固定する（過剰な trim 実装を増やさない）。

---

## 2. 回帰 guard（既存 spec 非破壊）

### 2.1 そのまま通るべき既存 spec

実装変更後も **無改修で GREEN** を維持すること（Phase 5 完了時に確認）:

- `MemberDetailSections.component.spec.tsx`（TC-U-01〜04 + 空 section 非表示）: props 形状 `sections: NormalizedSection[]` を維持するため不変。
- `MemberActivity.component.spec.tsx`: MemberActivity は流用・props 不変。
- `MemberTags.component.spec.tsx`: tags 空時の挙動を変える場合（AC-3「タグ未設定」表示）は **同 wave で更新**（下記 2.3）。
- `MemberCard.spec.tsx` / その他 public spec: 本タスク非対象、無影響を確認。

### 2.2 MemberLinks props 変更に伴う同 wave 更新（必須）

Phase 5 §2.7 案 A を採用した場合、`MemberLinks.component.spec.tsx`（現行 TC-U-05〜07 は `sections` props 前提）が **コンパイル不能になる**。同 wave で以下へ更新:

| 旧 TC | 新 TC | 変更 |
| ----- | ----- | ---- |
| TC-U-05（url のみ抽出） | TC-L-01 | props を `links={[{stableKey,label,href}]}` に変更。adapter が抽出済みなので「渡した links が全て `<a>` になる」を assert |
| TC-U-06（links 無で null） | TC-L-02 | `links={[]}` → `container.firstChild === null` |
| TC-U-07（target/rel） | TC-L-03 | href が `<a href>` に入り `target="_blank" rel="noopener noreferrer"` |

> 案 B（MemberDetail 側逆変換・props 不変）を採用した場合は MemberLinks spec を変更せず、MemberDetail spec 側で links→`<a>` 配線を検証する。Phase 5 で選んだ案に従う。

### 2.3 MemberTags 空時表示（AC-3 整合）

proto は tags 空時「タグ未設定」を表示する。現行 `MemberTags` は `tags.length===0` で `null` を返し、MemberDetail 側も `tags.length>0` でガードしている。AC-3 を満たすため Phase 5 で「MemberDetail のガード撤廃 + MemberTags が空時に "タグ未設定" を描画」へ変更する場合:

| TC | ケース | 期待 |
| -- | ------ | ---- |
| TC-T-01 | tags 1 件以上 | chip 群描画（既存挙動） |
| TC-T-02 | tags 空 | "タグ未設定" テキストを含むプレースホルダ描画（null を返さない） |

`MemberTags.component.spec.tsx` を同 wave で更新（空時 null を期待する既存ケースがあれば差し替え）。

---

## 3. Lane B 補助ケース（`build-seed-sql.spec.ts` 追加）

| TC | ケース | 期待 |
| -- | ------ | ---- |
| TC-S-07 | profile 未指定 member 後方互換（再掲強化） | TEST-MEM-08（profile 無し）の response_fields が `fullName`/`occupation`/`ubmZone` 3 行のみ。profile 専用キー（hometown 等）の行が無い |
| TC-S-08 | profile の fullName が member.fullName と一致 | TEST-MEM-01 の response_fields `fullName` 値が member.fullName と一致（summary ブレ防止・Phase 5 §3.1 注記） |
| TC-S-09 | cleanup は profile 拡充の影響を受けない | `buildCleanupSql()` が responseId スコープ DELETE のままで、response_fields を responseId IN (...) で削除（行数増でも cleanup 不変） |
| TC-S-10 | search_text 退行なし | profile 拡充後も `searchTextFor` 出力に fullName/occupation/ubmZone/email を含む（既存検索性維持） |

---

## 4. 追加テストファイル / ケース一覧

| ファイル | 追加 TC |
| -------- | ------- |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | TC-A-20〜29 |
| `apps/web/src/components/public/__tests__/BusinessOverviewSection.component.spec.tsx` | TC-B-09 |
| `apps/web/src/components/public/__tests__/PersonalSection.component.spec.tsx` | TC-P-07 |
| `apps/web/src/components/public/__tests__/MessageCard.component.spec.tsx` | TC-M-06 |
| `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx` | TC-H-05 |
| `apps/web/src/components/public/__tests__/MemberLinks.component.spec.tsx` | TC-L-01〜03（props 形状更新・案 A 時） |
| `apps/web/src/components/public/__tests__/MemberTags.component.spec.tsx` | TC-T-01/02（空時表示変更時） |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | TC-S-07〜10 |

---

## 5. DoD

- [ ] fail path / 境界 TC（TC-A-20〜29 / TC-B-09 / TC-P-07 / TC-M-06 / TC-H-05 / TC-S-07〜10）が GREEN。
- [ ] MemberLinks props 変更に伴う spec 更新が完了し GREEN（採用案に対応）。
- [ ] MemberTags 空時表示を変更した場合、対応 spec が GREEN。
- [ ] 既存 spec（MemberDetailSections / MemberActivity / 他 public）が無改修で GREEN。
- [ ] 「空白のみ」値の扱いが実装と一致（過剰 trim を増やさない）。
- [ ] targeted vitest 全 GREEN、typecheck / lint green。
