function runPhase1Tests() {
  assertEquals_('abc-123', normalizeProductCode_('ABC 123', []), 'product_code 正規化');
  assertEquals_('サンプル商品', resolveTitle_({ title: 'サンプル商品' }, []), '共通商品名');
  assertEquals_('|683|530|', normalizeCategory_('683,530', []), 'カテゴリ整形');
  assertEquals_('100227', normalizeRakutenGenreId_('100227', []), '楽天ジャンルID');
  assertEquals_('1001100', normalizeYahooProductCategory_('1001100', []), 'Yahooカテゴリ');
  assertEquals_('1480', resolveSalePrice_('1480', []), '販売価格');
  assertEquals_('1', resolveTaxRule_('1', []).reducedTaxRateFlag, 'food_flag=1');
  assertEquals_('10', resolveTaxRule_('0', []).taxRate, 'food_flag=0');
  assertEquals_('|217199|', normalizeYahooPath_('', '217199', []), 'Yahooパス fallback');
  assertEquals_('202604051200', normalizeRakutenSalePeriod_('202604051200', 'rakuten_sale_start', '開始', []), '楽天販売期間');

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
    jan_code: '4542320580542',
    food_flag: '1',
    image_count: '3',
    image_ext: 'png',
    ai_catchcopy: '毎日使いやすい',
    ai_description_material: '説明文',
    attribute_template_key: '',
    note: '',
    publish_phase1: '1',
    publish_rakuten: '1',
    publish_yahoo: '1'
  }, 3);
  assertEquals_('100227', phase1Record.irItemRow['楽天ジャンルID'], 'ir-item 楽天ジャンルID');
  assertEquals_('1001100', phase1Record.irItemRow['yahooプロダクトカテゴリ'], 'ir-item Yahooカテゴリ');
  assertEquals_(0, phase1Record.errors.length, 'Phase1 record errors');

  const rakutenRecord = buildRakutenItemsubRecord_({
    product_code: 'sample-product',
    title: '共通商品名',
    category: '683|530',
    rakuten_genre_id: '100227',
    yahoo_product_category: '1001100',
    sale_price: '1480',
    jan_code: '4542320580542',
    food_flag: '1',
    image_count: '2',
    image_ext: 'jpg',
    ai_catchcopy: '共通キャッチ',
    ai_description_material: '共通説明',
    rakuten_title: '楽天商品名',
    rakuten_catchcopy: '楽天キャッチ',
    rakuten_pc_desc: '楽天PC説明',
    rakuten_sales_desc: '楽天販売説明',
    rakuten_sp_desc: '楽天スマホ説明',
    rakuten_display_category: '683|530',
    rakuten_sale_start: '202604051200',
    rakuten_sale_end: '202604302359',
    rakuten_shipping_code: '0',
    rakuten_delivery_set_id: '1',
    rakuten_delivery_lead_time: '1',
    rakuten_stock_lead_time: '10',
    rakuten_stock_management_id: '1',
    rakuten_search_visible_flag: '0',
    rakuten_double_price_text: '1',
    publish_rakuten: '1'
  }, 3);
  assertEquals_('楽天商品名', rakutenRecord.itemsubRow['商品名'], '楽天 itemsub 商品名');
  assertEquals_('202604051200', rakutenRecord.itemsubRow['販売期間（開始）'], '楽天 itemsub 販売開始');
  assertEquals_(0, rakutenRecord.errors.length, '楽天 record errors');

  const yahooRecord = buildYahooItemsubRecord_({
    product_code: 'sample-product',
    title: '共通商品名',
    category: '683|530',
    yahoo_product_category: '1001100',
    sale_price: '1480',
    jan_code: '4542320580542',
    food_flag: '1',
    ai_catchcopy: '共通キャッチ',
    ai_description_material: '共通説明',
    yahoo_title: 'Yahoo商品名',
    yahoo_catchcopy: 'Yahooキャッチ',
    yahoo_desc: 'Yahoo説明',
    yahoo_sp_free: 'Yahooスマホ',
    yahoo_path: '683|530',
    yahoo_page_code: 'sample-product',
    yahoo_shipping_group_id: '2',
    yahoo_upload_target_flag: '1',
    yahoo_hidden_page_flag: '0',
    publish_yahoo: '1'
  }, 3);
  assertEquals_('Yahoo商品名', yahooRecord.itemsubRow['商品名'], 'Yahoo itemsub 商品名');
  assertEquals_('2', yahooRecord.itemsubRow['配送グループ管理番号'], 'Yahoo 配送グループ');
  assertEquals_(0, yahooRecord.errors.length, 'Yahoo record errors');

  assertEquals_(393, IR_ITEM_HEADER.length, 'ir-item ヘッダ数');
  assertEquals_(28 + PHASE1_CONFIG.maxImageSlots, RAKUTEN_ITEMSUB_HEADER.length, '楽天 itemsub ヘッダ数');
  assertEquals_(19, YAHOO_ITEMSUB_HEADER.length, 'Yahoo itemsub ヘッダ数');
  assertEquals_(41, PHASE1_INPUT_SCHEMA.length, '中間入力列数');

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
