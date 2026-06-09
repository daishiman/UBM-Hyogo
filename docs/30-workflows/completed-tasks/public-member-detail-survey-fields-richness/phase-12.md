# Phase 12: ドキュメント更新

> 本 phase-12.md は Phase 12 成果物の仕様である。今回サイクルで local 実装、Phase 11 local screenshots、`outputs/phase-12/` の strict 7 成果物は作成済み。commit/PR と authenticated staging screenshot は user-gated のため未実行。

---

## 0. Phase 12 成果物（strict 7 ファイル・canonical filename 固定）

実装サイクルで以下 7 ファイルを `outputs/phase-12/` に作る。canonical filename は別名・短縮形を許容しない（skill 固定表）。

| canonical path | Task | 役割 |
| -------------- | ---- | ---- |
| `outputs/phase-12/main.md` | 12-0 | 30種思考法 compact evidence + 4条件 verdict の集約サマリー |
| `outputs/phase-12/implementation-guide.md` | 12-1 | Part1 中学生レベル例え話 + Part2 技術詳細の 2 パート実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 12-2 | system spec 更新サマリー（Step 1-A/1-B/1-C / Step 2 / canonical-mirror parity / artifacts 同期） |
| `outputs/phase-12/documentation-changelog.md` | 12-3 | 変更ファイル一覧 / validator 結果 / current-baseline 区別 / 4 点同期記録 |
| `outputs/phase-12/unassigned-task-detection.md` | 12-4 | 未タスク検出表（0 件でも summary 必須）+ formalize decision |
| `outputs/phase-12/skill-feedback-report.md` | 12-5 | skill 改善 feedback（改善なしでも「なし」+ 理由） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 12-6 | Task 1〜5 完了確認 / planned wording 0 件 / validator 実測の最終 compliance |

---

## 1. Task 12-1: implementation-guide.md（2 パート構成）

### 1.1 Part 1（中学生レベル・例え話必須）— 逐語コピペ用ドラフト

> 下記ドラフトを `implementation-guide.md` Part 1 へ**逐語コピペ**する（AI による自然な書き直し・推敲は禁止。drift fence）。

#### x.1 公開メンバー詳細ページの「セクション分け」とは何か

##### 日常生活での例え

会員みんなにアンケート用紙を配って、いろいろな質問に答えてもらった状況に似ています。

たとえば、アンケート用紙には「お仕事は何ですか」「得意なことは」「趣味は」「ひとことメッセージを」といった欄が並んでいます。集めた答えを、そのまま順番に書き写しただけの紙を壁に貼ると、どこに何が書いてあるか分かりにくくて、せっかく書いてもらった内容が読み手に伝わりません。

そこで、答えを「名刺」のようにきれいに割り付けます。お名前と顔写真は名刺の上の目立つところ（Hero）、お仕事の説明は「ビジネス概要」の欄、趣味や座右の銘は「パーソナル」の欄、ひとことメッセージは大きな引用カードに、というふうに、決まった場所へちゃんと書き写すのです。

これまでの公開ページは「アンケートの答えを順番にそのまま並べただけ」でした。今回は「答えを名刺の決まった欄にちゃんと書き写す」ように作り直します。

##### この機能でできること

| 機能 | 説明 | 例 |
| ---- | ---- | -- |
| セクション分け | 答えを 5 つの決まった欄に振り分ける | 「お仕事の説明」はビジネス概要の欄へ |
| 空欄の自然な処理 | 答えていない欄は、見栄えが崩れないように静かに隠す / 「—」を出す | 趣味が空なら「—」、メッセージが空ならカードごと隠す |
| 取りこぼし防止 | どの欄にも当てはまらない新しい質問も「その他」の欄に必ず出す | 後から増えた質問も消えない |
| 確認用データの充実 | 動作確認用の見本会員（TEST-MEM-01）に全部の答えを入れておく | 全部の欄が埋まった見本を画面で確認できる |

##### 専門用語セルフチェック（Part 1 で使ったら即説明する）

| 用語 | Part 1 での扱い |
| ---- | -------------- |
| adapter | Part 1 では使わない（「答えを欄に書き写す係」と表現） |
| stableKey | Part 1 では使わない（「アンケートの質問の番号」と表現） |
| seed | Part 1 では「動作確認用の見本データ」と言い換え |
| visibility | Part 1 では「公開してよい欄かどうか」と言い換え |

### 1.2 Part 2（技術詳細）

実装済み local のため「previous contract」と「implemented delta」を分けて書く。

#### current contract（実装前）

- `toMemberDetailProps(profile, { onUnknownKind? })` が `publicSections` を section title そのまま + 一律 KV の flat 構造へ変換。
- `ProfileHero` は hometown chip を持たず Avatar `lg`、eyebrow 無し。

#### target delta（実装後）

- **型: `MemberDetailProps`（拡張）**
  - `hero: MemberDetailHero`（fullName/nickname/occupation/location/ubmZone/ubmMembershipType/**hometown**/photoUrl?）
  - `business: MemberDetailBusiness`（businessOverview/skills/canProvide）
  - `personal: ReadonlyArray<MemberDetailKV>`（PERSONAL_KEYS 順で 4 行固定・空は "—"）
  - `message: string`（selfIntroduction・空は ""）
  - `tags` / `links: ReadonlyArray<MemberDetailLink>`（url kind のみ・空値除外）
  - `other: ReadonlyArray<NormalizedSection>`（固定割当外の public field）
  - `attendance`
- **シグネチャ（不変）**: `toMemberDetailProps(profile: PublicMemberProfile, opts?: { onUnknownKind?: (kind: string) => void }): MemberDetailProps`。引数・関数名は維持し戻り値型のみ拡張。`__testInternals` に割当定数を追加。
- **セクション割当マップ**（`@ubm-hyogo/shared` の `STABLE_KEY` 経由・リテラル直書き禁止）:

  | セクション | stableKey 集合 |
  | ---------- | -------------- |
  | hero(summary) | fullName, nickname, location, occupation, ubmZone, ubmMembershipType |
  | hero(抽出) | hometown |
  | business | businessOverview, skills, canProvide |
  | personal | hobbies, recentInterest, motto, otherActivities |
  | message | selfIntroduction |
  | links | kind==="url" の全 field |
  | other | 上記いずれにも割当されない visibility=public field（else フォールバック） |

- **新規 component の props 型**: `BusinessOverviewSectionProps` / `PersonalSectionProps`（rows）/ `MessageCardProps`（message・空で `null`）。data 属性 `business-overview` / `personal-section` / `member-message`。
- **Lane B**: `TestMemberAccount.profile?: Readonly<Record<string,string>>` 追加。`build-seed-sql` の `STABLE_KEYS` 固定撤廃 → `answersFor(member)` を profile 基底へ。後方互換（profile 無しは従来 3 項目）。

#### エッジケース（implementation-guide に明記）

| ケース | 挙動 |
| ------ | ---- |
| publicSections 空 | hero(summary) のみ / business "—" / message・other 非表示 |
| hometown 不在 | Hero の hometown chip 非表示 |
| selfIntroduction 不在 | MessageCard が `null` |
| url 値 空文字 | links から除外 |
| 未知 kind | `onUnknownKind` 通知の上 skip |
| member/admin field 混入 | adapter で `visibility!=="public"` 除外（AC-8 二重防御） |
| seed profile 未指定 member | 従来 3 項目で seed（後方互換） |

#### 視覚証跡セクション（VISUAL）

VISUAL タスクのため、implementation-guide.md の「視覚証跡」節に Phase 11 の 3 canonical screenshot（`member-detail-full.png` / `member-detail-sparse.png` / `member-detail-message-hidden.png`）への参照を明記し、各ファイルが対応する AC を紐づける。実 capture は実装サイクルで取得し、spec 段階では参照と「runtime capture pending」境界を記録する。

#### 識別子 drift 確認（W1-02b-3）

implementation-guide.md に記載する関数名・props 名・型名（`toMemberDetailProps` / `MemberDetailProps` / `ProfileHeroProps.hometown` / `STABLE_KEY.*`）は、実装サイクルで現行コードを `grep` 確認してから compliance-check を PASS にする。代表 snippet は型定義・props interface から引用する。

---

## 2. Task 12-2: system-spec-update-summary.md

### Step 1-A / 1-B / 1-C

- **Step 1-A**: `aiworkflow-requirements` / `task-specification-creator` の `LOGS`（現行運用は `LOGS/_legacy.md` + dated changelog fragment）と `SKILL.md` 変更履歴を、本 wave の canonical absolute path で更新。
- **Step 1-B**: `specs/09e-screen-blueprints-public.md` §3 と整合確認。公開メンバー詳細の表示項目が proto 準拠（5 セクション）になったことが既存 spec の記述と一致するかを確認し、乖離があれば current facts へ補正（新規 spec 記述追加は最小限）。
- **Step 1-C**: topic-map.md / index 群を `generate-index.js`（`pnpm indexes:rebuild`）で再生成し drift 0 を確認。

### Step 2（新規インターフェース判定）

- `MemberDetailProps` の拡張（hero に hometown 追加 / business / personal / message / links / other 構造化）は web 層内部 adapter の公開型。**public API / IPC contract 変更ではない**（endpoint 不変）。
- 新規 component props 型（`BusinessOverviewSectionProps` 等）は web 内部。
- Step 2 判定: 内部型の拡張は `interfaces-*.md` への型定義配置対象になりうるが、API/IPC 契約は不変のため `stale contract withdrawal / 正本同期` 観点で「endpoint surface 不変」を明記する。新規 API/型が無いことだけを理由に Step 2 を N/A にせず、`09e-screen-blueprints-public.md` との整合確認結果を Step 2 へ記録する。

### artifacts 同期 / mirror parity

- root `artifacts.json` と `outputs/artifacts.json` の title/type/status/phase artifact 名 parity を初手で確認。
- skill mirror（`.claude/skills/<skill>` ↔ `.agents/skills/<skill>`）は `diff -qr`、存在しなければ N/A 理由を記録。

---

## 3. Task 12-3: documentation-changelog.md

### entry checklist（Phase 12 着手の最初の手・生出力転記）

```bash
git status --porcelain apps/ packages/ 2>/dev/null
git diff --name-only main...HEAD -- 'apps/**' 'packages/**'
git status --porcelain -- infra/ scripts/ .github/ tests/fixtures/ docs/30-workflows/runbooks/
```

- 上記の生出力を documentation-changelog.md 冒頭の「entry checklist」へ転記。
- 本タスクは今回サイクルで `apps/web` / `apps/api` に diff が入り、Phase 11 local screenshots も取得したため、`implemented_local_visual_present_staging_pending` へ再分類済み。staging seed apply / authenticated staging screenshot / commit / PR は user-gated として記録する。

### 必須エントリ最小セット（7 カテゴリ）

| カテゴリ | path 例 | 本タスクでの扱い |
| -------- | ------- | ---------------- |
| skill 正本 | `.claude/skills/aiworkflow-requirements/SKILL.md` / `.claude/skills/task-specification-creator/SKILL.md` | 該当変更時のみ列挙 |
| skill 履歴 | `.claude/skills/<skill>/LOGS/_legacy.md` + `changelog/<yyyymmdd-task>.md`（LOGS.md 不在理由を明記） | 同上 |
| skill reference | `.claude/skills/<skill>/references/*.md` | 変更時のみ |
| workflow artifacts | `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/{index.md,artifacts.json}` | 必須 |
| workflow outputs | `outputs/{artifacts.json,phase-12/*.md}` | 必須 |
| system spec | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | 整合確認結果 |
| validator 実行記録 | コマンド逐語 + exit code + 件数（HEX grep 0 / `verify-design-tokens` / placeholder token grep 0） | 必須 |

- touch していないカテゴリは「該当なし: 理由」を 1 行残す。
- validator は「コマンド / exit code / 件数」の 3 値を揃える。

---

## 4. Task 12-4: unassigned-task-detection.md（baseline 含む）

0 件でも summary を残す。標準表 `検出項目 / status(open|done|baseline|duplicate) / formalize decision / path / 根拠`。

| 検出項目 | status | formalize decision | 根拠 |
| -------- | ------ | ------------------ | ---- |
| M-1: visual baseline 自動更新の別ワークフロー委譲 | baseline | 今回サイクル外。既存 authenticated staging visual ワークフローで回収。起票判断は別途 | phase-3.md §7 / phase-10.md §2 |
| M-2: 他公開テストメンバーの profile 充実度 | baseline | TEST-MEM-01 を正本とし最小限。他メンバー充実は将来候補 | phase-3.md §7 / phase-1.md §2 |
| proto の vertical / split2 Hero レイアウト切替 | baseline | 既定 `hero` レイアウトのみ実装で AC 充足。切替は将来候補 | 09e §3.3 |

> current（今回 wave で解消すべき）未タスクは 0 件想定。上記は baseline（今回差分起因でない将来候補）として記録。1 件以上 current が出た場合は `docs/30-workflows/unassigned-task/*.md` に `audit-unassigned-tasks.js --target-file` が通る full template で formalize する。

---

## 5. Task 12-5: skill-feedback-report.md

各苦戦箇所に `promotion target / no-op reason / evidence path` を付ける。確認 scope（task-specification-creator / aiworkflow-requirements / skill-creator / validation scripts）と no-op 理由を明記すれば「改善点なし」も可。

想定 feedback 候補（実装サイクルで確定）:

| 苦戦箇所候補 | promotion target / no-op |
| ------------ | ------------------------ |
| `MemberLinks` props 形状変更で既存 spec が壊れる risk | no-op（Phase 5 で最小差分選択・既存 spec 同 wave 更新で吸収）/ 該当すれば patterns へ |
| seed `STABLE_KEYS` 動的化と field_count 整合 | no-op（build-seed-sql spec で実測固定）/ 再発時に test-accounts 知見へ |
| Phase 4 hex-grep-gate 雛形の前倒し配置有無 | 雛形不在で Phase 11 初出になった場合は skill-feedback へ起票（再発抑止） |

---

## 6. Task 12-6: phase12-task-spec-compliance-check.md

Task 12-1〜12-5 の全完了確認後に作成。確認項目:

- 7 成果物が `outputs/phase-12/` に実在（canonical filename 一致）。
- planned wording 0 件: `rg -n "計画|予定|TODO|will be|を予定|仕様策定のみ|保留として記録" outputs/phase-12/*.md` が 0 件。
- identifier drift 0（§1.2 W1-02b-3）。
- `implemented_local_visual_present_staging_pending` の root path / status 整合（local screenshot present と staging pending を混同しない）。
- VISUAL: `Spec template completeness = PASS` と `Production/runtime compliance = PENDING_RUNTIME_EVIDENCE` を分離（実 production PASS を主張しない）。
- Phase 13 は user approval 未取得なら `blocked` を維持。
- skill mirror parity（存在時 `diff -qr` / 不在時 N/A 理由）。

---

## 7. システム仕様書整合（proto 準拠の current fact 化）

- 公開メンバー詳細の表示項目が proto 準拠（5 セクション）になったことを `specs/09e-screen-blueprints-public.md` §3 と整合確認し、結果を system-spec-update-summary.md に記録。
- 新規インターフェース（`MemberDetailProps` 拡張）は Step 2 対象になりうる旨を記録（API/IPC 契約は不変）。
