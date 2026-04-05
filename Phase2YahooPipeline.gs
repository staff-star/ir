function refreshYahooConfirmationSheet() {
  const result = buildYahooPhase2Result_();
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.yahooReview, result.reviewRows, 1);
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.yahooErrors, result.errorRows, 1);
}

function exportYahooItemsubCsv() {
  const result = buildYahooPhase2Result_();
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.yahooReview, result.reviewRows, 1);
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.yahooErrors, result.errorRows, 1);

  const exportRows = result.records
    .filter(function (record) { return record.shouldExport; })
    .map(function (record) {
      return YAHOO_ITEMSUB_HEADER.map(function (header) {
        return normalizeCellValue_(record.itemsubRow[header]);
      });
    });

  if (exportRows.length === 0) {
    throw new Error('Yahoo itemsub の出力対象がありません。publish_yahoo と Yahooエラー一覧 を確認してください。');
  }

  downloadCsvFile_(
    buildExportFileName_('ir-itemsub_Yahoo', 'csv'),
    [YAHOO_ITEMSUB_HEADER].concat(exportRows),
    PHASE1_CONFIG.exportEncoding.yahooItemsub
  );
}

function buildYahooPhase2Result_() {
  const sourceRows = readInputRows_();
  const records = sourceRows.map(function (sourceRow, index) {
    return buildYahooItemsubRecord_(sourceRow, index + 3);
  });

  appendDuplicateProductCodeErrorsByPublishFlag_(records);

  return {
    records: records,
    reviewRows: [YAHOO_REVIEW_SCHEMA].concat(records.map(buildYahooReviewRow_)),
    errorRows: buildErrorRowsFromRecords_(records, YAHOO_ERROR_SCHEMA, 'publish_yahoo')
  };
}

function buildYahooItemsubRecord_(source, sourceRowNumber) {
  const errors = [];
  const normalized = {};
  const defaults = PHASE1_CONFIG.mallSettings.yahoo.defaults;

  normalized.publishFlag = normalizePublishFlag_(source.publish_yahoo);
  normalized.mainProductCode = normalizeProductCode_(source.product_code, errors);
  normalized.mainTitle = resolveTitle_(source, errors);
  normalized.shopName = PHASE1_CONFIG.mallSettings.yahoo.shopName;
  normalized.productCode = normalized.mainProductCode;
  normalized.path = normalizeOptionalYahooPath_(defaults.path, errors);
  normalized.yahooProductCategory = normalizeYahooProductCategory_(source.yahoo_product_category, errors);
  normalized.title = resolveMallTitle_(source.yahoo_title, source.title, 'yahoo_title', 'Yahooの商品名', errors);
  normalized.catchcopy = trimToString_(source.yahoo_catchcopy) || trimToString_(source.ai_catchcopy);
  normalized.salePrice = resolveSalePrice_(source.sale_price, errors);
  normalized.productInfo = '';
  normalized.description = trimToString_(source.yahoo_desc) || trimToString_(source.ai_description_material);
  normalized.spFree = trimToString_(source.yahoo_sp_free);
  normalized.janCode = normalizeJanCode_(source.jan_code, errors);
  normalized.uploadTargetFlag = normalizeChoiceField_(defaults.uploadTargetFlag, 'yahoo_upload_target_flag', 'Yahooのアップロード対象', errors, ['0', '1'], { defaultValue: '' });
  normalized.hiddenPageFlag = normalizeChoiceField_(defaults.hiddenPageFlag, 'yahoo_hidden_page_flag', 'Yahooの隠しページ設定', errors, ['0', '1'], { defaultValue: '0' });
  normalized.pageOpenFlag = trimToString_(defaults.pageOpenFlag);
  normalized.pointRateType = defaults.pointRateType;
  normalized.pointRate = defaults.pointRate;
  normalized.allowOverOrder = defaults.allowOverOrder;
  normalized.stockLeadMessage = defaults.stockLeadMessage;
  normalized.shippingGroupId = normalizeDigitsField_(
    source.yahoo_shipping_group_id || defaults.defaultShippingGroupId,
    'yahoo_shipping_group_id',
    'Yahooの配送グループ番号',
    errors,
    { required: false, maxDigits: 2 }
  );

  const itemsubRow = createEmptyRowFromHeader_(YAHOO_ITEMSUB_HEADER);
  itemsubRow['メインデータの商品コード（楽天URL）'] = normalized.mainProductCode;
  itemsubRow['メインデータの商品名'] = normalized.mainTitle;
  itemsubRow['ショップ名'] = normalized.shopName;
  itemsubRow['商品コード'] = normalized.productCode;
  itemsubRow['パス'] = normalized.path;
  itemsubRow['yahooプロダクトカテゴリ'] = normalized.yahooProductCategory;
  itemsubRow['商品名'] = normalized.title;
  itemsubRow['キャッチコピー'] = normalized.catchcopy;
  itemsubRow['通常販売価格'] = normalized.salePrice;
  itemsubRow['商品情報'] = normalized.productInfo;
  itemsubRow['商品情報改行フラグ'] = '0';
  itemsubRow['商品説明'] = normalized.description;
  itemsubRow['商品説明改行フラグ'] = '0';
  itemsubRow['フリースペース（スマホのみ）'] = normalized.spFree;
  itemsubRow['フリースペース（スマホのみ）改行フラグ'] = '0';
  itemsubRow['JANコード/ISBNコード'] = normalized.janCode;
  itemsubRow['アップロード対象設定'] = normalized.uploadTargetFlag;
  itemsubRow['隠しページ設定'] = normalized.hiddenPageFlag;
  itemsubRow['ページ公開'] = normalized.pageOpenFlag;
  itemsubRow['ポイント倍率設定区分'] = normalized.pointRateType;
  itemsubRow['商品別ポイント倍率'] = normalized.pointRate;
  itemsubRow['在庫数を超えた注文'] = normalized.allowOverOrder;
  itemsubRow['在庫あり時の表示文言'] = normalized.stockLeadMessage;
  itemsubRow['配送グループ管理番号'] = normalized.shippingGroupId;

  return {
    sourceRowNumber: sourceRowNumber,
    source: source,
    normalized: normalized,
    itemsubRow: itemsubRow,
    errors: errors,
    shouldExport: normalized.publishFlag === '1' && errors.length === 0
  };
}

function buildYahooReviewRow_(record) {
  return [
    record.sourceRowNumber,
    record.source.publish_yahoo || '',
    record.shouldExport ? '1' : '0',
    record.normalized.mainProductCode || '',
    record.normalized.mainTitle || '',
    record.normalized.shopName || '',
    itemsubValue_(record, '商品コード'),
    itemsubValue_(record, 'パス'),
    itemsubValue_(record, 'yahooプロダクトカテゴリ'),
    itemsubValue_(record, '商品名'),
    itemsubValue_(record, 'アップロード対象設定'),
    itemsubValue_(record, '隠しページ設定'),
    itemsubValue_(record, 'ページ公開'),
    itemsubValue_(record, 'ポイント倍率設定区分'),
    itemsubValue_(record, '商品別ポイント倍率'),
    itemsubValue_(record, '在庫数を超えた注文'),
    itemsubValue_(record, '在庫あり時の表示文言'),
    itemsubValue_(record, '商品情報改行フラグ'),
    itemsubValue_(record, '商品説明改行フラグ'),
    itemsubValue_(record, 'フリースペース（スマホのみ）改行フラグ'),
    String(record.errors.length),
    buildErrorMessages_(record.errors)
  ];
}

function normalizeOptionalYahooPath_(value, errors) {
  const rawValue = trimToString_(value);
  if (!rawValue) {
    return '';
  }
  return normalizeCategoryLike_(rawValue, 'yahoo_path', 'Yahooのパス', false, errors);
}
