# Phase 12 Implementation Guide: ut-08a-01-public-use-case-coverage-hardening

## Part 1: 中学生レベル

このタスクは、学校の持ち物チェック表に抜けがないか確かめる作業に似ている。すでに大きな確認は終わっているが、公開ページを支える小さな動きの確認が足りないため、あとで本番に出す前に不安が残る。そこで、フォームの下書き、会員プロフィール、統計、会員一覧が「普通に見える時」「空の時」「失敗した時」にどう動くかを、テストで確認する。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| coverage | チェック済みの割合 |
| use-case | 画面の裏で行うひとまとまりの仕事 |
| route handler | 入口で依頼を受け取る係 |
| D1 | データをしまう箱 |
| evidence | 確認した証拠 |

## Part 2: 技術者レベル

対象は `apps/api/src/use-cases/public/{form-preview,public-member-profile,public-stats,public-members}.ts` と、必要最小限の public route handler unit test。各 use-case は happy / null-or-empty / D1-fail を最低1ケースずつ持つ。

API surface は既存 public contract を変更しない。テスト実装時は fake D1 または既存 repository mock を使い、responseEmail system field、responseId/memberId separation、public/member/admin boundary を壊さない。

実測コマンドは Phase 9/11 で固定し、coverage threshold は Statements/Functions/Lines >=85%、Branches >=80%。08a 親 artifacts の AC-6 PARTIAL 更新は、このタスクの実測 PASS 後に別途反映する。
