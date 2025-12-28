/**
 * PDF engine detection and availability utilities.
 * @module utils/pdf-engines
 * @license MIT. See LICENSE.md for details.
 */

const { execSync } = require('child_process');

/**
 * Supported PDF engines with their command names and descriptions.
 */
const PDF_ENGINES = {
  wkhtmltopdf: {
    command: 'wkhtmltopdf',
    name: 'wkhtmltopdf',
    description: 'HTML to PDF converter using Qt WebKit',
    website: 'https://wkhtmltopdf.org/'
  },
  phantomjs: {
    command: 'phantomjs',
    name: 'PhantomJS',
    description: 'Headless WebKit scriptable with JavaScript',
    website: 'https://phantomjs.org/'
  },
  phantom: {
    command: 'phantomjs',
    name: 'PhantomJS (alias)',
    description: 'Headless WebKit scriptable with JavaScript',
    website: 'https://phantomjs.org/'
  },
  weasyprint: {
    command: 'weasyprint',
    name: 'WeasyPrint',
    description: 'Visual rendering engine for HTML and CSS',
    website: 'https://weasyprint.org/'
  }
};

/**
 * Check if a command is available in the system PATH.
 * @param {string} command - The command to check.
 * @returns {boolean} True if the command is available.
 */
function isCommandAvailable(command) {
  try {
    const isWin = process.platform === 'win32';
    const checkCmd = isWin ? `where ${command}` : `which ${command}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a specific PDF engine is available.
 * @param {string} engine - The engine name (wkhtmltopdf, phantomjs, weasyprint).
 * @returns {Object} Object with `available` boolean and engine info.
 */
function checkPdfEngine(engine) {
  const engineInfo = PDF_ENGINES[engine.toLowerCase()];
  if (!engineInfo) {
    return {
      available: false,
      error: `Unknown PDF engine: ${engine}`,
      supported: Object.keys(PDF_ENGINES).filter(k => k !== 'phantom')
    };
  }

  const available = isCommandAvailable(engineInfo.command);
  return {
    available,
    engine: engine.toLowerCase(),
    ...engineInfo,
    error: available ? null : `${engineInfo.name} is not installed or not in PATH`
  };
}

/**
 * Get all available PDF engines on the system.
 * @returns {Array<Object>} Array of available engine info objects.
 */
function getAvailablePdfEngines() {
  const engines = ['wkhtmltopdf', 'phantomjs', 'weasyprint'];
  return engines
    .map(eng => checkPdfEngine(eng))
    .filter(info => info.available);
}

/**
 * Get the best available PDF engine (prefer wkhtmltopdf, then weasyprint, then phantom).
 * @returns {Object|null} The best available engine info, or null if none available.
 */
function getBestAvailablePdfEngine() {
  const priority = ['wkhtmltopdf', 'weasyprint', 'phantomjs'];
  for (const eng of priority) {
    const info = checkPdfEngine(eng);
    if (info.available) {
      return info;
    }
  }
  return null;
}

/**
 * Get a helpful error message when no PDF engine is available.
 * @returns {string} A formatted error message with installation hints.
 */
function getPdfEngineInstallHint() {
  const isLinux = process.platform === 'linux';
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';

  let hint = 'No PDF engine is installed. Install one of the following:\n\n';

  if (isLinux) {
    hint += '  wkhtmltopdf:  sudo apt-get install wkhtmltopdf\n';
    hint += '  weasyprint:   pip install weasyprint\n';
  } else if (isMac) {
    hint += '  wkhtmltopdf:  brew install wkhtmltopdf\n';
    hint += '  weasyprint:   pip install weasyprint\n';
  } else if (isWin) {
    hint += '  wkhtmltopdf:  Download from https://wkhtmltopdf.org/downloads.html\n';
    hint += '  weasyprint:   pip install weasyprint\n';
  } else {
    hint += '  wkhtmltopdf:  https://wkhtmltopdf.org/downloads.html\n';
    hint += '  weasyprint:   pip install weasyprint\n';
  }

  hint += '\nAfter installation, ensure the command is available in your PATH.';
  return hint;
}

module.exports = {
  PDF_ENGINES,
  isCommandAvailable,
  checkPdfEngine,
  getAvailablePdfEngines,
  getBestAvailablePdfEngine,
  getPdfEngineInstallHint
};
