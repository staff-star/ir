function runPhase1Tests() {
  assertEquals_('abc-123', normalizeProductCode_('ABC 123', []), 'product_code 正規化');
  assertEquals_('サンプル商品', resolveTitle_({ title: 'サンプル商品' }, []), '共通商品名');
  assertEquals_('|683|530|', normalizeCategory_('683,530', []), 'カテゴリ整形');
  assertEquals_('100227', normalizeRakutenGenreId_('100227', []), '楽天ジャンルID');
  assertEquals_('1001100', normalizeYahooProductCategory_('1001100', []), 'Yahooカテゴリ');
  assertEquals_('1480', resolveSalePrice_('1480', []), '販売価格');
  assertEquals_('1', resolveTaxRule_('1', []).reducedTaxRateFlag, 'food_flag=1');
  assertEquals_('10', resolveTaxRule_('0', []).taxRate, 'food_flag=0');
  assertEquals_('1', deriveRakutenShippingCodeFromDeliverySet_('5'), '楽天配送セット 5');
  assertEquals_('0', deriveRakutenShippingCodeFromDeliverySet_('2'), '楽天配送セット 2');
  assertEquals_('', deriveRakutenShippingCodeFromDeliverySet_('9'), '楽天配送セット その他');

  const imageErrors = [];
  const images = buildImageBundle_('sample-code', '3', 'png', imageErrors);
  assertEquals_(0, imageErrors.length, '画像生成エラー');
  assertEquals_(3, images.urls.length, '画像URL数');
  assertTrue_(images.urls.every(function (url) { return url.indexOf('/w.') === -1; }), '白背景画像なし');

  const phase1Record = buildPhase1Record_({
    product_code: 'sample-product',
    title: 'サンプル商品',
    category: '683|530',
    rakuten_genre_id: '100227',
    yahoo_product_category: '1001100',
    sale_price: '1480',
    rakuten_title: '楽天商品名',
    rakuten_catchcopy: '楽天キャッチ',
    rakuten_pc_desc: '楽天PC説明',
    rakuten_sales_desc: '楽天販売説明',
    rakuten_sp_desc: '楽天スマホ説明',
    yahoo_title: 'Yahoo商品名',
    yahoo_catchcopy: 'Yahooキャッチ',
    yahoo_desc: 'Yahoo説明',
    yahoo_sp_free: 'Yahooスマホ',
    food_flag: '1',
    image_count: '3',
    image_ext: 'png',
    rakuten_delivery_set_id: '5',
    yahoo_shipping_group_id: '2',
    attribute_template_key: '',
    note: '',
    jan_code: '4542320580542'
  }, 3);
  assertEquals_('100227', phase1Record.irItemRow['楽天ジャンルID'], 'ir-item 楽天ジャンルID');
  assertEquals_('1001100', phase1Record.irItemRow['yahooプロダクトカテゴリ'], 'ir-item Yahooカテゴリ');
  assertEquals_('1480', phase1Record.irItemRow['表示価格'], 'ir-item 表示価格');
  assertEquals_('', phase1Record.irItemRow['キャッチコピー'], 'ir-item キャッチコピー空欄');
  assertEquals_('', phase1Record.irItemRow['モバイルキャッチコピー'], 'ir-item モバイルキャッチコピー空欄');
  assertEquals_('', phase1Record.irItemRow['PC用商品説明文'], 'ir-item PC説明空欄');
  assertEquals_('', phase1Record.irItemRow['モバイル用商品説明文'], 'ir-item モバイル説明空欄');
  assertEquals_('', phase1Record.irItemRow['スマートフォン用商品説明文'], 'ir-item スマホ説明空欄');
  assertEquals_(0, phase1Record.errors.length, 'Phase1 record errors');

  const rakutenRecord = buildRakutenItemsubRecord_({
    product_code: 'sample-product',
    title: '共通商品名',
    category: '683|530',
    rakuten_genre_id: '100227',
    yahoo_product_category: '1001100',
    sale_price: '1480',
    rakuten_title: '楽天商品名',
    rakuten_catchcopy: '楽天キャッチ',
    rakuten_pc_desc: '楽天PC説明',
    rakuten_sales_desc: '楽天販売説明',
    rakuten_sp_desc: '楽天スマホ説明',
    yahoo_title: 'Yahoo商品名',
    yahoo_catchcopy: 'Yahooキャッチ',
    yahoo_desc: 'Yahoo説明',
    yahoo_sp_free: 'Yahooスマホ',
    food_flag: '1',
    image_count: '2',
    image_ext: 'jpg',
    rakuten_delivery_set_id: '5',
    yahoo_shipping_group_id: '2',
    attribute_template_key: '',
    note: '',
    jan_code: '4542320580542'
  }, 3);
  assertEquals_('sample-product', rakutenRecord.itemsubRow['メインデータの商品コード（楽天URL）'], '楽天 先頭1列');
  assertEquals_('共通商品名', rakutenRecord.itemsubRow['メインデータの商品名'], '楽天 先頭2列');
  assertEquals_('美味セレクト楽天市場店', rakutenRecord.itemsubRow['ショップ名'], '楽天 先頭3列');
  assertEquals_('', rakutenRecord.itemsubRow['表示先カテゴリ'], '楽天 表示先カテゴリは空欄');
  assertEquals_('', rakutenRecord.itemsubRow['楽天ジャンルID'], '楽天 genre は空欄');
  assertEquals_('1480', rakutenRecord.itemsubRow['通常購入販売価格'], '楽天 通常価格');
  assertEquals_('1480', rakutenRecord.itemsubRow['表示価格'], '楽天 表示価格');
  assertEquals_('1', rakutenRecord.itemsubRow['二重価格文言'], '楽天 二重価格文言');
  assertEquals_('', rakutenRecord.itemsubRow['カタログID'], '楽天 カタログIDは空欄');
  assertEquals_('1', rakutenRecord.itemsubRow['送料'], '楽天 送料導出');
  assertEquals_('', rakutenRecord.itemsubRow['商品画像1'], '楽天 画像1は空欄');
  assertEquals_('', rakutenRecord.itemsubRow['商品属性（項目）1'], '楽天 属性1 項目は空欄');
  assertEquals_('リードタイム（１日）', rakutenRecord.itemsubRow['在庫あり時出荷リードタイム'], '楽天 在庫あり時出荷リードタイム');
  assertEquals_('1', rakutenRecord.itemsubRow['在庫あり時納期管理番号'], '楽天 在庫あり時納期管理番号');
  assertEquals_(0, rakutenRecord.errors.length, '楽天 record errors');

  const yahooRecord = buildYahooItemsubRecord_({
    product_code: 'sample-product',
    title: '共通商品名',
    category: '683|530',
    rakuten_genre_id: '100227',
    yahoo_product_category: '1001100',
    sale_price: '1480',
    rakuten_title: '楽天商品名',
    rakuten_catchcopy: '楽天キャッチ',
    rakuten_pc_desc: '楽天PC説明',
    rakuten_sales_desc: '楽天販売説明',
    rakuten_sp_desc: '楽天スマホ説明',
    yahoo_title: 'Yahoo商品名',
    yahoo_catchcopy: 'Yahooキャッチ',
    yahoo_desc: 'Yahoo説明',
    yahoo_sp_free: 'Yahooスマホ',
    food_flag: '1',
    image_count: '2',
    image_ext: 'jpg',
    rakuten_delivery_set_id: '5',
    yahoo_shipping_group_id: '2',
    attribute_template_key: '',
    note: '',
    jan_code: '4542320580542'
  }, 3);
  assertEquals_('sample-product', yahooRecord.itemsubRow['メインデータの商品コード（楽天URL）'], 'Yahoo 先頭1列');
  assertEquals_('共通商品名', yahooRecord.itemsubRow['メインデータの商品名'], 'Yahoo 先頭2列');
  assertEquals_('美味セレクト Yahoo店', yahooRecord.itemsubRow['ショップ名'], 'Yahoo 先頭3列');
  assertEquals_('', yahooRecord.itemsubRow['商品コード'], 'Yahoo 商品コードは空欄');
  assertEquals_('', yahooRecord.itemsubRow['yahooプロダクトカテゴリ'], 'Yahoo カテゴリは空欄');
  assertEquals_('', yahooRecord.itemsubRow['通常販売価格'], 'Yahoo 通常販売価格は空欄');
  assertEquals_('', yahooRecord.itemsubRow['JANコード/ISBNコード'], 'Yahoo JANは空欄');
  assertEquals_('', yahooRecord.itemsubRow['商品情報'], 'Yahoo 商品情報は空欄');
  assertEquals_('Yahoo説明', yahooRecord.itemsubRow['商品説明'], 'Yahoo 商品説明');
  assertEquals_('Yahooスマホ', yahooRecord.itemsubRow['フリースペース（スマホのみ）'], 'Yahoo フリースペース');
  assertEquals_('0', yahooRecord.itemsubRow['隠しページ設定'], 'Yahoo 隠しページ設定');
  assertEquals_('', yahooRecord.itemsubRow['ページ公開'], 'Yahoo ページ公開');
  assertEquals_('', yahooRecord.itemsubRow['在庫あり時の表示文言'], 'Yahoo 在庫あり時の表示文言は空欄');
  assertEquals_('0', yahooRecord.itemsubRow['商品情報改行フラグ'], 'Yahoo 商品情報改行');
  assertEquals_('0', yahooRecord.itemsubRow['商品説明改行フラグ'], 'Yahoo 商品説明改行');
  assertEquals_('0', yahooRecord.itemsubRow['フリースペース（スマホのみ）改行フラグ'], 'Yahoo フリースペース改行');
  assertEquals_('2', yahooRecord.itemsubRow['配送グループ管理番号'], 'Yahoo 配送グループ');
  assertEquals_(0, yahooRecord.errors.length, 'Yahoo record errors');

  assertEquals_(393, IR_ITEM_HEADER.length, 'ir-item ヘッダ数');
  assertEquals_(117, RAKUTEN_ITEMSUB_HEADER.length, '楽天 itemsub ヘッダ数');
  assertEquals_(24, YAHOO_ITEMSUB_HEADER.length, 'Yahoo itemsub ヘッダ数');
  assertEquals_(23, PHASE1_INPUT_SCHEMA.length, '中間入力列数');

  SpreadsheetApp.getUi().alert('Phase1 / Phase2 のテストが完了しました。');
}

function assertEquals_(expected, actual, label) {
  if (expected !== actual) {
    throw new Error(`${label}: expected=${expected}, actual=${actual}`);
  }
}

function assertTrue_(condition, label) {
  if (!condition) {
    throw new Error(`${label}: expected true`);
  }
}
