import { describe, it, expect } from "vitest";
import { mapSheetRows } from "./sheets-to-members";

describe("mapSheetRows", () => {
  it("ヘッダ + 1 行を MemberRow に変換する", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "氏名", "公開同意", "規約同意"],
      ["2026-04-27T08:00:00Z", "alice@example.com", "Alice", "はい", "同意する"],
    ];
    const { rows, skipped } = mapSheetRows(values);
    expect(skipped).toEqual([]);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.responseEmail).toBe("alice@example.com");
    expect(r.fullName).toBe("Alice");
    expect(r.publicConsent).toBe("consented");
    expect(r.rulesConsent).toBe("consented");
    expect(r.responseId).toBe("2026-04-27t08:00:00z__alice@example.com");
  });

  it("submittedAt または email 不足はスキップ", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "氏名"],
      ["", "alice@example.com", "Alice"],
      ["2026-04-27T08:00:00Z", "", "Bob"],
    ];
    const { rows, skipped } = mapSheetRows(values);
    expect(rows).toHaveLength(0);
    expect(skipped).toHaveLength(2);
  });

  it("未知の列は extraFieldsJson に格納する", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "未知の質問"],
      ["2026-04-27T08:00:00Z", "alice@example.com", "answer"],
    ];
    const { rows } = mapSheetRows(values);
    expect(rows[0].extraFieldsJson).toContain("未知の質問");
    expect(rows[0].unmappedQuestionIdsJson).toContain("未知の質問");
  });

  it("consent 不明値は unknown を返す", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "公開同意"],
      ["2026-04-27T08:00:00Z", "alice@example.com", "後で"],
    ];
    const { rows } = mapSheetRows(values);
    expect(rows[0].publicConsent).toBe("unknown");
  });

  it("空 input は空 rows を返す", () => {
    expect(mapSheetRows([])).toEqual({ rows: [], skipped: [] });
  });

  // RC-1: 実スプレッドシートのヘッダーが正しい stableKey にマップされる（unmapped 0）。
  it("実フォームヘッダー（お名前/UBM区画 等）を正しい stableKey へマップする", () => {
    const values = [
      [
        "タイムスタンプ",
        "メールアドレス",
        "お名前（フルネーム）",
        "あだ名・ニックネーム",
        "お住まい（都道府県・市区町村）",
        "職業・仕事内容",
        "UBM区画",
        "UBM参加ステータス",
        "ビジネス概要",
        "X（Twitter）URL",
        "その他のSNS・URL",
      ],
      [
        "2026-04-27T08:00:00Z",
        "alice@example.com",
        "山田 太郎",
        "たろ",
        "兵庫県神戸市",
        "エンジニア",
        "0→1",
        "会員",
        "受託開発",
        "https://x.com/taro",
        "https://example.com/other",
      ],
    ];
    const { rows } = mapSheetRows(values);
    const r = rows[0];
    expect(r.fullName).toBe("山田 太郎");
    expect(r.nickname).toBe("たろ");
    expect(r.location).toBe("兵庫県神戸市");
    expect(r.occupation).toBe("エンジニア");
    expect(r.businessOverview).toBe("受託開発");
    expect(r.urlX).toBe("https://x.com/taro");
    expect(r.urlOthers).toBe("https://example.com/other");
    // 実ヘッダーは全てマップ済み → unmapped 無し。
    expect(r.unmappedQuestionIdsJson).toBeNull();
  });

  // RC-2: 実同意値 "同意する（掲載OK）" が consented に正規化される。
  it("同意する（掲載OK）を consented に正規化する", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "ホームページへの掲載に同意しますか？", "勧誘ルール・免責事項への同意"],
      ["2026-04-27T08:00:00Z", "alice@example.com", "同意する（掲載OK）", "同意する"],
    ];
    const { rows } = mapSheetRows(values);
    expect(rows[0].publicConsent).toBe("consented");
    expect(rows[0].rulesConsent).toBe("consented");
  });

  // CORR-5: zone / status の実値を enum 値ドメインへ正規化する。
  it("UBM区画/参加ステータスの実値を enum 値へ正規化する", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "UBM区画", "UBM参加ステータス"],
      ["2026-04-27T08:00:00Z", "a@example.com", "0→1", "会員"],
      ["2026-04-27T08:00:00Z", "b@example.com", "1→10", "非会員"],
      ["2026-04-27T08:00:00Z", "c@example.com", "10→100", "アカデミー"],
    ];
    const { rows } = mapSheetRows(values);
    expect(rows.map((r) => r.ubmZone)).toEqual(["0_to_1", "1_to_10", "10_to_100"]);
    expect(rows.map((r) => r.ubmMembershipType)).toEqual([
      "member",
      "non_member",
      "academy",
    ]);
  });

  it("未知の zone 値は raw のまま保持する（防御的・例外を投げない）", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "UBM区画"],
      ["2026-04-27T08:00:00Z", "a@example.com", "謎ゾーン"],
    ];
    const { rows } = mapSheetRows(values);
    expect(rows[0].ubmZone).toBe("謎ゾーン");
  });
});
