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

  normalized.publishFlag = normalizePublishFlag_(source.publish_yahoo);
  normalized.productCode = normalizeProductCode_(source.product_code, errors);
  normalized.pageCode = normalizeYahooPageCode_(source.yahoo_page_code, source.product_code, errors);
  normalized.path = normalizeYahooPath_(source.yahoo_path, source.category, errors);
  normalized.yahooProductCategory = normalizeYahooProductCategory_(source.yahoo_product_category, errors);
  normalized.title = resolveMallTitle_(source.yahoo_title, source.title, 'yahoo_title', 'Yahooの商品名', errors);
  normalized.catchcopy = trimToString_(source.yahoo_catchcopy) || trimToString_(source.ai_catchcopy);
  normalized.salePrice = resolveSalePrice_(source.sale_price, errors);
  normalized.tax = resolveTaxRule_(source.food_flag, errors);
  normalized.info = trimToString_(source.ai_description_material) || trimToString_(source.yahoo_desc);
  normalized.description = trimToString_(source.yahoo_desc) || trimToString_(source.ai_description_material);
  normalized.spFree = trimToString_(source.yahoo_sp_free);
  normalized.janCode = normalizeJanCode_(source.jan_code, errors);
  normalized.hiddenPageFlag = normalizeChoiceField_(source.yahoo_hidden_page_flag, 'yahoo_hidden_page_flag', 'Yahooのページ非公開', errors, ['0', '1'], { defaultValue: '0' });
  normalized.uploadTargetFlag = normalizeChoiceField_(source.yahoo_upload_target_flag, 'yahoo_upload_target_flag', 'Yahooのアップロード対象', errors, ['0', '1'], { defaultValue: '1' });
  normalized.shippingGroupId = normalizeDigitsField_(source.yahoo_shipping_group_id, 'yahoo_shipping_group_id', 'Yahooの配送グループ番号', errors, { required: false, maxDigits: 2 });

  const itemsubRow = createEmptyRowFromHeader_(YAHOO_ITEMSUB_HEADER);
  itemsubRow['メインデータの商品コード（楽天URL）'] = normalized.productCode;
  itemsubRow['ショップ名'] = PHASE1_CONFIG.mallSettings.yahoo.shopName;
  itemsubRow['商品コード'] = normalized.pageCode;
  itemsubRow['パス'] = normalized.path;
  itemsubRow['yahooプロダクトカテゴリ'] = normalized.yahooProductCategory;
  itemsubRow['商品名'] = normalized.title;
  itemsubRow['キャッチコピー'] = normalized.catchcopy;
  itemsubRow['消費税'] = normalized.tax.taxFlag;
  itemsubRow['通常販売価格'] = normalized.salePrice;
  itemsubRow['商品情報'] = normalized.info;
  itemsubRow['商品情報改行フラグ'] = normalized.info ? '1' : '0';
  itemsubRow['商品説明'] = normalized.description;
  itemsubRow['商品説明改行フラグ'] = normalized.description ? '1' : '0';
  itemsubRow['フリースペース（スマホのみ）'] = normalized.spFree;
  itemsubRow['フリースペース（スマホのみ）改行フラグ'] = normalized.spFree ? '1' : '0';
  itemsubRow['JANコード/ISBNコード'] = normalized.janCode;
  itemsubRow['ページ公開'] = normalized.hiddenPageFlag;
  itemsubRow['アップロード対象設定'] = normalized.uploadTargetFlag;
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
    record.normalized.productCode || '',
    record.normalized.pageCode || '',
    record.normalized.title || '',
    record.source.yahoo_path || '',
    record.normalized.path || '',
    record.source.yahoo_product_category || '',
    record.normalized.yahooProductCategory || '',
    record.source.sale_price || '',
    record.normalized.salePrice || '',
    record.source.yahoo_shipping_group_id || '',
    record.normalized.shippingGroupId || '',
    record.source.yahoo_upload_target_flag || '',
    record.normalized.uploadTargetFlag || '',
    record.source.yahoo_hidden_page_flag || '',
    record.normalized.hiddenPageFlag || '',
    record.normalized.info || '',
    record.normalized.description || '',
    record.normalized.spFree || '',
    String(record.errors.length),
    buildErrorMessages_(record.errors)
  ];
}

function normalizeYahooPageCode_(value, fallbackValue, errors) {
  let pageCode = trimToString_(value) || trimToString_(fallbackValue);

  if (!pageCode) {
    errors.push(buildError_('yahoo_page_code', 'REQUIRED', 'YahooのページIDを入力してください。'));
    return '';
  }

  pageCode = pageCode
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[　\s_]+/g, '-')
    .replace(/[^0-9a-z-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!pageCode) {
    errors.push(buildError_('yahoo_page_code', 'INVALID', 'YahooのページIDが空になりました。英小文字、数字、- のみになるように直してください。'));
    return '';
  }

  if (pageCode.length > 198) {
    errors.push(buildError_('yahoo_page_code', 'TOO_LONG', 'YahooのページIDは 198 文字以内で入力してください。'));
  }

  return pageCode;
}
