# admin_member_notes 読み取り Repository 新設 - タスク指示書

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | task-imp-02a-admin-member-notes-repository-001                      |
| タスク名     | admin_member_notes 読み取り Repository 新設                          |
| 分類         | 改善（実装 / Implementation）                                       |
| 対象機能     | 管理者向け会員詳細ビュー（AdminMemberDetailView）の audit データ取得 |
| 優先度       | 中                                                                  |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | Phase 12（02a-parallel-member-identity-status-and-response-repository） |
| 発見日       | 2026-04-27                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02a タスク（member identity / status / response repository）の Phase 12 において、
`apps/api/src/repository/_shared/builder.ts` に `buildAdminMemberDetailView()` を実装した。
このビルダーは `AdminMemberDetailView.audit` フィールドに格納される `adminNotes`
（管理者操作の監査ログ）を **引数で受け取る** 設計を採用している。

しかし、`adminNotes` を D1 から取得する read-only repository（`admin_member_notes` テーブルを
SELECT する関数群）は 02a の責務に含まれず未実装のまま残っている。
そのため、04c（admin backoffice API endpoints）が `buildAdminMemberDetailView()` を呼び出す際に
渡すべき `adminNotes` を取得する手段が存在しない。

### 1.2 問題点・課題

- `admin_member_notes` テーブルのスキーマは Phase 02a の D1 マイグレーションで作成済みだが、
  読み取り経路（repository 関数）が空白で、04c タスクが `buildAdminMemberDetailView()` を呼び出せない。
- builder 側は不変条件 #12（`adminNotes` を public/member view model に混ぜない）を守るために
  「caller が adminNotes を取得して引数で渡す」契約に寄せたため、その caller 側の取得経路が
  未整備のままだと API endpoint 実装が即詰まりになる。
- 04c 着手時にこの repository を即席で書くと、SQL 規約・brand 型・DbCtx 抽象などの統一が崩れる懸念がある。
  02a で確立した `_shared/{db,brand,sql}.ts` 規約に沿った専用 repository ファイルを先回りで用意したい。

### 1.3 放置した場合の影響

- 04c の admin backoffice API endpoints タスクが着手不能になる、
  または 04c 内で repository 層が即席実装され、02a で確立した分離規約・brand 型運用が壊れる。
- `buildAdminMemberDetailView()` の audit フィールドに常に空配列が渡される暫定実装が長期化し、
  管理者監査機能が機能しないまま MVP リリースを迎えるリスクがある。
- 不変条件 #12（admin notes が public/member view model に混入しないこと）の保証が
  caller 側に依存しているため、専用 repository を分離しないと「うっかり member-side の関数から
  admin notes を SELECT する」コードが書かれる隙が残る。

---

## 2. 何を達成するか（What）

### 2.1 目的

`admin_member_notes` テーブルから `adminNotes` を取得する read-only repository を
`apps/api/src/repository/adminMemberNotes.ts` に新設し、
04c タスクが `buildAdminMemberDetailView()` を呼び出せる前提条件を整える。

### 2.2 最終ゴール

- `apps/api/src/repository/adminMemberNotes.ts` が存在する。
- 同ファイルが member_id を引数に取り `Array<{ actor: AdminId; action: string; occurredAt: string; note: string | null }>` を返す関数 `listAdminNotesByMemberId(c: DbCtx, memberId: MemberId)` をエクスポートしている。
- 関数の戻り型が `buildAdminMemberDetailView()` の `adminNotes` 引数型と完全互換である。
- typecheck / lint / 既存テストがすべて通る。
- 単体テスト（fixture を用いた D1 SELECT 検証）が追加されている。
- 02a で確立した規約（`_shared/db`、`_shared/brand`、`_shared/sql` の利用、prepare/bind パターン）に準拠している。

### 2.3 スコープ

#### 含むもの

- `apps/api/src/repository/adminMemberNotes.ts` の新規作成
- `listAdminNotesByMemberId(c, memberId)` 関数の実装（read-only）
- 戻り値の DTO 型（builder.ts の引数型と一致）
- `apps/api/src/repository/__tests__/adminMemberNotes.test.ts` 単体テスト
- 必要に応じて `__fixtures__` への seed データ追加
- `_shared/brand.ts` に `AdminId` brand 型が未定義であれば追加

#### 含まないもの

- admin notes の **書き込み**（INSERT / UPDATE / DELETE）— これは 04c または別タスクで扱う
- `buildAdminMemberDetailView()` 内部での自動取得への切り替え（不変条件 #12 維持のため caller 取得を継続）
- 04c API endpoint 側の実装（呼び出し側）
- attendance / tag_assignment_queue / section metadata 等、他の未割り当てタスクの解消

### 2.4 成果物

| 成果物 | パス |
| ------ | ---- |
| repository 実装 | `apps/api/src/repository/adminMemberNotes.ts` |
| 単体テスト | `apps/api/src/repository/__tests__/adminMemberNotes.test.ts` |
| brand 型追記（必要時） | `apps/api/src/repository/_shared/brand.ts` |
| fixture 追記（必要時） | `apps/api/src/repository/__fixtures__/...` |

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 02a タスクの Phase 1〜13 がすべて完了している（D1 マイグレーション・builder 実装済み）。
- `admin_member_notes` テーブルが D1 schema に存在する。
- `apps/api/src/repository/_shared/{db,brand,sql,builder}.ts` が利用可能。
- `mise install` 済みで Node 24 / pnpm 10 環境で動作する。

### 3.2 依存タスク

- 02a-parallel-member-identity-status-and-response-repository（完了済み・前提）
- 01a-d1-schema-and-tag-seed（admin_member_notes テーブル定義の前提）

### 3.3 必要な知識

- Cloudflare D1 binding と `prepare/bind/all/first` パターン
- TypeScript の brand 型（`MemberId`, `AdminId` 等）と既存の `_shared/brand.ts` 規約
- 02a で確立した repository ファイル構成（identities.ts / status.ts / responses.ts 等のスタイル）
- 不変条件 #12: admin notes を public/member view model に絶対に混ぜない

### 3.4 推奨アプローチ

1. `identities.ts` を雛型として読み、ファイル冒頭コメント・import・export 関数の構造を踏襲する。
2. `_shared/brand.ts` で `AdminId` が未定義なら brand 型として追加する。
3. `listAdminNotesByMemberId(c, memberId)` を実装。SELECT は `member_id = ?1` で、
   並び順は `occurred_at DESC` を採用（管理 UI で新しい順に表示する想定）。
4. DB row → DTO 変換は内部関数 `mapRowToAdminNote` に分離し、列名のキャメル変換と brand 適用を一括化する。
5. 単体テストは既存の `__fixtures__` を流用、admin_member_notes に複数行 seed を入れて
   ソート順・空配列ケース・他 member の混入禁止を検証する。

---

## 4. 実行手順

### Phase構成

小規模タスクのため 3 Phase 構成：実装準備 → 実装 → テスト・検証。

### Phase 1: 実装準備（コンテキスト読み込みと型確認）

#### 目的

既存規約に沿った実装方針を確定する。

#### 手順

1. `apps/api/src/repository/identities.ts` と `status.ts` を読み、ファイル構成・import 順を把握する。
2. `_shared/builder.ts` の `buildAdminMemberDetailView()` の `adminNotes` 引数型を再確認し、
   新規関数の戻り型を完全一致させる。
3. `_shared/brand.ts` を読み `AdminId` の有無を確認し、なければ追加方針を決める。
4. D1 schema の `admin_member_notes` テーブル定義（カラム名・型・index）を確認する。

#### 成果物

- 実装方針メモ（戻り型の決定、AdminId brand 追加要否）

#### 完了条件

- builder.ts の `adminNotes` 引数型と一字一句一致する戻り型が決まっている。
- `admin_member_notes` テーブルの全カラムが把握できている。

### Phase 2: 実装

#### 目的

`adminMemberNotes.ts` を新設し read-only 関数を実装する。

#### 手順

1. 必要なら `_shared/brand.ts` に `AdminId` brand 型を追加する。
2. `apps/api/src/repository/adminMemberNotes.ts` を新規作成する。
3. ファイル冒頭に「不変条件 #12: admin notes は public/member view model には混ぜない。
   このファイルは admin 経路からのみ呼び出すこと」と明記する。
4. `listAdminNotesByMemberId(c: DbCtx, memberId: MemberId)` を実装。
   SQL は `SELECT actor_admin_id, action, occurred_at, note FROM admin_member_notes WHERE member_id = ?1 ORDER BY occurred_at DESC`。
5. row → DTO 変換ヘルパー（snake_case → camelCase、brand 適用）を内部関数として定義。
6. typecheck / lint を実行して通るまで修正する。

#### 成果物

- `apps/api/src/repository/adminMemberNotes.ts`
- 必要に応じた `_shared/brand.ts` 差分

#### 完了条件

- `mise exec -- pnpm typecheck` が通る。
- `mise exec -- pnpm lint` が通る。
- 戻り値型が `buildAdminMemberDetailView()` の `adminNotes` 引数型に代入可能である。

### Phase 3: テスト・検証

#### 目的

read-only 関数の挙動を fixture ベース単体テストで保証する。

#### 手順

1. `__tests__/adminMemberNotes.test.ts` を作成。
2. fixture に同一 member_id で 3 件、別 member_id で 1 件の admin notes を投入する seed を追加。
3. テストケース：
   - 正常: 該当 member_id の 3 件を `occurred_at DESC` 順で返す。
   - 空配列: 存在しない member_id を渡すと空配列を返す。
   - 分離: 別 member_id の note が混入しない。
4. `mise exec -- pnpm test` を実行して通るまで修正。
5. `buildAdminMemberDetailView()` のテストから `listAdminNotesByMemberId()` を呼び出して
   引数として渡す smoke test を 1 件追加（任意・推奨）。

#### 成果物

- `apps/api/src/repository/__tests__/adminMemberNotes.test.ts`
- fixture seed 追記

#### 完了条件

- 全テストグリーン。
- カバレッジ：listAdminNotesByMemberId の 3 ケース（正常・空・分離）が全て検証されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/api/src/repository/adminMemberNotes.ts` が存在し `listAdminNotesByMemberId` をエクスポートしている
- [ ] 戻り型が `buildAdminMemberDetailView()` の `adminNotes` 引数型と互換
- [ ] member_id でフィルタされ、他 member の note が混入しない
- [ ] `occurred_at DESC` 順でソートされている
- [ ] 該当 0 件の場合は空配列を返す（null や例外ではない）

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 通過
- [ ] `mise exec -- pnpm lint` 通過
- [ ] `mise exec -- pnpm test` 通過
- [ ] 単体テストが 3 ケース以上カバーしている
- [ ] 02a で確立した repository 規約（_shared 利用・prepare/bind・brand 型）に準拠
- [ ] ファイル冒頭コメントで不変条件 #12 を明示

### ドキュメント要件

- [ ] `outputs/phase-12/unassigned-task-detection.md` の該当エントリが「Formal task: 完了」へ更新可能な状態
- [ ] 04c タスク仕様書から本 repository を依存先として参照できる粒度になっている
- [ ] 不変条件 #12 への言及がコードコメントとテストコメントの両方に存在する

---

## 6. 検証方法

### テストケース

| # | ケース | 入力 | 期待出力 |
| - | ------ | ---- | -------- |
| 1 | 正常系（複数件） | member_id = mid_A（3件登録済） | 3 件を occurred_at DESC で返す |
| 2 | 空配列 | member_id = mid_未登録 | `[]` |
| 3 | 分離 | member_id = mid_A（mid_B の note も DB に存在） | mid_B の note が混入していない |

### 検証手順

1. `mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm test` をすべて通す。
2. ローカル D1 に対し `wrangler d1 execute`（`scripts/cf.sh` 経由）で seed を投入し、
   試作 endpoint または vitest 経由で動作確認する。
3. `buildAdminMemberDetailView()` を呼ぶダミー consumer を一時的に書き、`audit` が想定通り埋まることを目視確認（任意）。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| `admin_member_notes` のカラム名が想定と異なる | 中 | 低 | Phase 1 で D1 schema を必ず確認し、列名を一次ソースから引用する |
| 不変条件 #12 が将来コードレビューで揺らぐ | 高 | 中 | ファイル冒頭コメントに明記し、ESLint カスタムルールや CODEOWNERS で守る運用を 04c タスクで検討 |
| `AdminId` brand 型が未整備で型衝突 | 中 | 中 | Phase 2 冒頭で brand.ts を確認し、未定義なら同 PR で追加する |
| occurred_at の型不整合（ISO string vs unix） | 低 | 低 | builder.ts 引数型に合わせて string で扱う。schema が unix なら ISO 変換ユーティリティを併設 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/index.md`
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/outputs/phase-12/implementation-guide.md`
- `apps/api/src/repository/_shared/builder.ts`（`buildAdminMemberDetailView` 定義 / 不変条件 #12 コメント）
- `apps/api/src/repository/identities.ts`（雛型として参照）
- `CLAUDE.md`（不変条件 #5: D1 直接アクセスは apps/api に閉じる）

### 参考資料

- 02a Phase 12 skill-feedback-report.md（builder の責務分離議論）
- 04c admin backoffice API endpoints（呼び出し側・依存先タスク）

---

## 9. 備考

### 苦戦箇所【記入必須】

> 02a Phase 02〜04 の builder 設計時に発生した判断コストを記録する。

| 項目 | 内容 |
| ---- | ---- |
| 症状 | `buildAdminMemberDetailView()` 設計時、admin notes の取得を builder 内部で行うか caller に委ねるかで判断に時間を要した。さらに admin notes の repository をどのファイルに置くか（identities.ts に同居 / 専用ファイル新設 / _shared 配下に隠蔽）の選定で議論が割れた。 |
| 原因 | 不変条件 #12（admin notes が public/member view model に混入しないこと）を「型の構造で保証する」のか「呼び出し経路で保証する」のかが仕様書に明記されておらず、builder の引数仕様と repository ファイル分離方針を同時に決める必要があったため。member-side repository（identities.ts / status.ts）と admin-side repository を同一ファイルに置くと、関数 import 経由で公開系コードへ漏れるリスクが残ることに気づくのに時間がかかった。 |
| 対応 | (1) 不変条件 #12 の保証境界を「caller 側に寄せる」と決定。`buildAdminMemberDetailView()` は adminNotes を引数で受け取り、PublicMemberProfile / MemberProfile の型からは admin フィールドを完全に排除した。(2) admin notes の取得 repository は専用ファイル（adminMemberNotes.ts）として member-side の identities.ts / status.ts / responses.ts と物理分離する方針を採用。(3) 02a スコープ内では builder の引数契約のみ確定し、repository 実装本体は本未完了タスクへ切り出して 04c の前提条件として整備する流れに整理した。 |
| 再発防止 | (a) 「admin」「member」「public」の view model 境界を持つ機能では、最初に「保証境界（型 / caller / runtime check のどれで守るか）」を決めてから builder の引数を設計する。(b) 不変条件番号（#12 等）はビルダーのファイル冒頭コメントだけでなく、対応する repository ファイル冒頭にも書き写し、grep で発見可能にする。(c) view model 横断のヘルパー（builder）と DB アクセス（repository）の責務を Phase 02 段階で明示分離し、未確定の取得元は未割り当てタスクとして 早期に切り出す。source evidence: `outputs/phase-12/unassigned-task-detection.md`、`apps/api/src/repository/_shared/builder.ts:220-295`。 |

### レビュー指摘の原文（該当する場合）

```
（unassigned-task-detection.md より抜粋）

### 1. admin_member_notes テーブルの読み取り

- 内容: admin_member_notes テーブルから adminNotes を取得する repository 関数
- 理由: buildAdminMemberDetailView は adminNotes を引数で受け取る設計のため、呼び出し側が取得責務を担う
- 推奨担当: 04c（admin backoffice API endpoints）タスク
```

### 補足事項

- 本タスクは 04c タスク着手前に必ず完了させること。04c は本 repository を依存前提として呼び出す。
- 書き込み（admin notes の登録・更新・削除）は本タスクのスコープ外。書き込み API が必要になった時点で
  別の未割り当てタスクとして切り出す（write 経路は監査要件・権限確認が絡むため設計コストが別物）。
- 不変条件 #12 を守るため、本ファイルの export を `apps/web` から import することは禁止
  （CLAUDE.md 不変条件 #5 と整合）。レビュー時に必ず確認する。
