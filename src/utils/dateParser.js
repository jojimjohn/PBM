/**
 * Date Parser Utility
 *
 * Provides consistent date parsing and formatting across the application.
 * Supports multiple input formats commonly used in the region:
 * - DD/MM/YYYY (Oman/Middle East standard)
 * - YYYY-MM-DD (ISO/Database format)
 * - DD-MM-YYYY (Alternative format)
 */

/**
 * Supported date format patterns
 */
export const DATE_FORMATS = {
  DMY_SLASH: 'DD/MM/YYYY',
  ISO: 'YYYY-MM-DD',
  DMY_DASH: 'DD-MM-YYYY',
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD'
};

/**
 * Parse a date string into a Date object
 * Automatically detects format or uses specified formats
 *
 * @param {string} input - Date string to parse
 * @param {string[]} formats - Optional array of formats to try (default: all supported)
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export function parseDate(input, formats = null) {
  if (!input) return null;

  // If already a Date object, return it (validate it's valid)
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  // Convert to string and trim
  const dateStr = String(input).trim();
  if (!dateStr) return null;

  // Default formats to try in order of preference
  const formatsToTry = formats || [
    DATE_FORMATS.ISO,        // YYYY-MM-DD (most reliable)
    DATE_FORMATS.DMY_SLASH,  // DD/MM/YYYY (user preference)
    DATE_FORMATS.DMY_DASH    // DD-MM-YYYY (alternative)
  ];

  for (const format of formatsToTry) {
    const parsed = parseDateWithFormat(dateStr, format);
    if (parsed) return parsed;
  }

  return null;
}

/**
 * Parse a date string with a specific format
 *
 * @param {string} dateStr - Date string to parse
 * @param {string} format - Expected format
 * @returns {Date|null} - Parsed Date object or null if doesn't match format
 */
function parseDateWithFormat(dateStr, format) {
  let day, month, year;

  switch (format) {
    case DATE_FORMATS.ISO: // YYYY-MM-DD
      {
        const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!match) return null;
        [, year, month, day] = match;
      }
      break;

    case DATE_FORMATS.DMY_SLASH: // DD/MM/YYYY
      {
        const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!match) return null;
        [, day, month, year] = match;
      }
      break;

    case DATE_FORMATS.DMY_DASH: // DD-MM-YYYY
      {
        const match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (!match) return null;
        [, day, month, year] = match;
      }
      break;

    default:
      return null;
  }

  // Convert to numbers
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);

  // Validate ranges
  if (!isValidDateParts(y, m, d)) return null;

  // Create date (month is 0-indexed in JS)
  const date = new Date(y, m - 1, d);

  // Verify the date didn't roll over (e.g., Feb 30 -> Mar 2)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }

  return date;
}

/**
 * Validate date parts are within valid ranges
 */
function isValidDateParts(year, month, day) {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}

/**
 * Format a Date object to a string
 *
 * @param {Date|string} date - Date to format (or date string to parse first)
 * @param {string} format - Output format (default: DD/MM/YYYY for display)
 * @returns {string} - Formatted date string or empty string if invalid
 */
export function formatDate(date, format = DATE_FORMATS.DISPLAY) {
  // Parse if string
  const dateObj = typeof date === 'string' ? parseDate(date) : date;

  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  switch (format) {
    case DATE_FORMATS.ISO:
    case DATE_FORMATS.API:
      return `${year}-${month}-${day}`;

    case DATE_FORMATS.DMY_SLASH:
    case DATE_FORMATS.DISPLAY:
      return `${day}/${month}/${year}`;

    case DATE_FORMATS.DMY_DASH:
      return `${day}-${month}-${year}`;

    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Format a date for API submission (ISO format)
 *
 * @param {Date|string} date - Date to format
 * @returns {string} - ISO formatted date (YYYY-MM-DD) or empty string
 */
export function formatDateForAPI(date) {
  return formatDate(date, DATE_FORMATS.API);
}

/**
 * Format a date for display (DD/MM/YYYY format)
 *
 * @param {Date|string} date - Date to format
 * @returns {string} - Display formatted date or empty string
 */
export function formatDateForDisplay(date) {
  return formatDate(date, DATE_FORMATS.DISPLAY);
}

/**
 * Check if a date string is valid
 *
 * @param {string} input - Date string to validate
 * @returns {boolean} - True if valid date
 */
export function isValidDate(input) {
  return parseDate(input) !== null;
}

/**
 * Get today's date at midnight (start of day)
 *
 * @returns {Date} - Today's date
 */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Compare two dates (ignoring time)
 *
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} - -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1, date2) {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 && !d2) return 0;
  if (!d1) return -1;
  if (!d2) return 1;

  // Reset time components for comparison
  const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();

  if (t1 < t2) return -1;
  if (t1 > t2) return 1;
  return 0;
}

/**
 * Check if a date is within a range (inclusive)
 *
 * @param {Date|string} date - Date to check
 * @param {Date|string} minDate - Minimum date (optional)
 * @param {Date|string} maxDate - Maximum date (optional)
 * @returns {boolean} - True if date is within range
 */
export function isDateInRange(date, minDate = null, maxDate = null) {
  const d = parseDate(date);
  if (!d) return false;

  if (minDate) {
    const min = parseDate(minDate);
    if (min && compareDates(d, min) < 0) return false;
  }

  if (maxDate) {
    const max = parseDate(maxDate);
    if (max && compareDates(d, max) > 0) return false;
  }

  return true;
}

/**
 * Add days to a date
 *
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date|null} - New date or null if invalid
 */
export function addDays(date, days) {
  const d = parseDate(date);
  if (!d) return null;

  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export default {
  DATE_FORMATS,
  parseDate,
  formatDate,
  formatDateForAPI,
  formatDateForDisplay,
  isValidDate,
  getToday,
  compareDates,
  isDateInRange,
  addDays
};
