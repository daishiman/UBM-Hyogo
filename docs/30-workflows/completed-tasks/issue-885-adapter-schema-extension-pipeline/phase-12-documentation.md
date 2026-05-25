# Phase 12: ドキュメント反映

## 1. 中学生レベル概念説明

### 1.1 「adapter」って何？

ウェブサイトの裏側では、APIサーバーが「会員のデータ」を返してくれます。でもそのデータの形（例えば項目の名前や順番）は、画面に表示するのに必要な形とぴったり一致しているわけではありません。

そのままだと、画面側のコードが「あれ、`visibility=admin` の項目も来てるけど、これは見せちゃダメだったよね？」とか「`kind` が知らない値だけど、どうする？」と毎回考えないといけません。

そこで間に **adapter（アダプター）** という変換係を置きます。adapter は次の仕事をします:

- 「公開していい項目だけ」に絞る（visibility filter）
- 「知らない種類の項目」は黙って捨てる（silent skip）
- 「入力のデータをそのまま書き換えない」（pure function）
- 出力は「画面が必要な形」に整える

これでうしろのデータ形が少し変わっても、画面コードは adapter にだけ頼ればよくなります。

### 1.2 「schema 拡張」って何？

「会員のデータに新しい項目を増やすこと」です。例えば、いまは「名前」「肩書き」「タグ」しかないところに、「SNSリンク」を増やしたいとします。これを「schema を拡張する」と言います。

### 1.3 なぜ「順序」が大事？

新しい項目を増やすときに、コードを触る場所が複数あります:

1. データの形を定義している `zod` schema
2. テスト用のサンプルデータ（fixture）
3. テストコード（spec）
4. adapter 本体
5. 画面表示部品（primitive）

このうち、テストの最初のケースは「サンプルデータが schema 通りか」を毎回チェックします。なので、サンプルデータを先に増やして schema を後にすると、テスト全部が一気に落ちて原因が分かりにくくなります。

逆に **schema → サンプル → テスト → adapter → 画面** の順で触ると、各ステップで「いま何が落ちているか」が明確になります。これが「red → green の TDD サイクル」です。

### 1.4 なぜこの README が必要？

このルールが「serial-06 を書いた人の頭の中」にしかなかったので、半年後に他の人（もしくは未来の自分）が schema を拡張するときに、また悩むことになります。文章で残せば、誰でも同じ手順で安全に拡張できます。

## 2. 反映先

| ドキュメント | 反映内容 |
|---|---|
| `apps/web/src/lib/adapters/README.md`（新規） | 本タスクの本体成果物 |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | EXTENSION TEMPLATE コメントブロック |
| 親 spec の Phase 12 implementation-guide | **追記しない**（serial-06 は upstream context。本 issue 専用の README に集約する方針） |
| `CLAUDE.md` | **更新しない**（adapter 内部の運用知識であり、プロジェクト全体不変条件ではない） |
| aiworkflow-requirements / skill 群 | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-serial-06-form-response-binding-2026-05.md` の follow-up 参照を昇格先 workflow に更新 |

## 3. system spec 影響

- `docs/00-getting-started-manual/specs/` 配下: 影響なし
- `docs/00-getting-started-manual/claude-design-prototype/` 配下: 影響なし
- D1 / API schema: 影響なし
- aiworkflow-requirements: serial-06 lessons の follow-up path drift のみ補正済み

## 4. 用語の追記候補

「adapter」「sanitize literal 復元」「fixture self-validation」の 3 用語を README 内で説明しているため、`docs/00-getting-started-manual/specs/` の用語集への昇格は不要。adapter 内部の語彙として閉じておく。

## 5. Phase 12 DoD

- [x] 中学生レベル説明が `outputs/phase-12/implementation-guide.md` に記述されている
- [x] 反映先表に従い CLAUDE.md / 親 spec を不必要に更新していない
- [x] aiworkflow-requirements の旧 unassigned-task 参照が昇格先 workflow に置換されている
