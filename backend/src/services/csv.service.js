const { parse } = require("csv-parse/sync");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Standardize header key variations
function normalizeHeader(header) {
  const clean = String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (["date", "transactiondate", "txdate", "time"].includes(clean)) return "date";
  if (["title", "description", "desc", "merchant", "payee", "name"].includes(clean)) return "title";
  if (["amount", "sum", "cost", "value", "price"].includes(clean)) return "amount";
  if (["type", "transactiontype", "txtype"].includes(clean)) return "type";
  if (["category", "tag", "group", "class"].includes(clean)) return "category";

  return clean;
}

// Convert various date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD) to ISO YYYY-MM-DD
function normalizeDate(rawDate) {
  if (!rawDate || typeof rawDate !== "string") return null;
  const trimmed = rawDate.trim();

  // Already YYYY-MM-DD
  if (DATE_REGEX.test(trimmed)) {
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === trimmed) {
      return trimmed;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    const candidate = `${year}-${month}-${day}`;
    const d = new Date(candidate);
    if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === candidate) {
      return candidate;
    }
  }

  // Try standard Date parse
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function parseAndValidateCsv(bufferString) {
  let records;
  try {
    records = parse(bufferString, {
      columns: (headers) => headers.map(normalizeHeader),
      skip_empty_lines: true,
      trim: true,
    });
  } catch (parseError) {
    throw new Error(`CSV Parsing failed: ${parseError.message}`);
  }

  if (!records || records.length === 0) {
    return {
      totalRows: 0,
      validTransactions: [],
      invalidRows: [],
      duplicateCount: 0,
    };
  }

  const validTransactions = [];
  const invalidRows = [];
  const seenRowSignatures = new Set();
  let duplicateCount = 0;

  records.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for header line
    const errors = [];

    // Title validation
    const rawTitle = row.title || row.description || row.merchant;
    if (!rawTitle || typeof rawTitle !== "string" || !rawTitle.trim()) {
      errors.push("Missing or empty transaction title");
    } else if (rawTitle.trim().length > 150) {
      errors.push("Title exceeds maximum length of 150 characters");
    }

    // Amount validation
    const rawAmount = String(row.amount || "").replace(/[^0-9.-]/g, "");
    const parsedAmount = Number(rawAmount);
    if (!rawAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push("Amount must be a positive finite number greater than zero");
    } else if (parsedAmount > 1_000_000_000_000) {
      errors.push("Amount exceeds maximum allowed limit (1 trillion)");
    }

    // Type validation
    let rawType = (row.type || "").toLowerCase().trim();
    if (!rawType) {
      // Default to expense if not specified
      rawType = "expense";
    }
    if (!["income", "expense"].includes(rawType)) {
      errors.push(`Invalid transaction type '${row.type}'. Expected 'income' or 'expense'`);
    }

    // Category validation
    const rawCategory = row.category || "Uncategorized";
    if (typeof rawCategory !== "string" || !rawCategory.trim()) {
      errors.push("Category must be a non-empty string");
    } else if (rawCategory.trim().length > 100) {
      errors.push("Category exceeds maximum length of 100 characters");
    }

    // Date validation
    const normalizedDate = normalizeDate(row.date);
    if (!normalizedDate) {
      errors.push(`Invalid or unparseable date format: '${row.date}'. Expected YYYY-MM-DD or DD/MM/YYYY`);
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        data: row,
        reasons: errors,
      });
      return;
    }

    const title = rawTitle.trim();
    const category = rawCategory.trim();
    const amount = Number(parsedAmount.toFixed(2));
    const type = rawType;
    const date = normalizedDate;

    // In-file duplicate detection (same date, amount, type, title, category)
    const signature = `${date}|${amount}|${type}|${title.toLowerCase()}|${category.toLowerCase()}`;
    if (seenRowSignatures.has(signature)) {
      duplicateCount++;
      invalidRows.push({
        rowNumber,
        data: row,
        reasons: ["Duplicate transaction detected in this CSV file"],
      });
      return;
    }
    seenRowSignatures.add(signature);

    validTransactions.push({
      title,
      amount,
      type,
      category,
      date,
    });
  });

  return {
    totalRows: records.length,
    validTransactions,
    invalidRows,
    duplicateCount,
  };
}

module.exports = {
  normalizeHeader,
  normalizeDate,
  parseAndValidateCsv,
};
