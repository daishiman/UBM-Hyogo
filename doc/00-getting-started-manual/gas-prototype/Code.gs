function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('UBM兵庫支部会 メンバーサイト Prototype')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
