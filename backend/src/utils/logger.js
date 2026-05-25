const chalk = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  gray: (t) => `\x1b[90m${t}\x1b[0m`,
};

const logger = {
  info: (message, ...args) => {
    console.log(`${chalk.blue('ℹ')} ${chalk.gray(new Date().toISOString())} ${message}`, ...args);
  },
  success: (message, ...args) => {
    console.log(`${chalk.green('✅')} ${chalk.gray(new Date().toISOString())} ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`${chalk.yellow('⚠️')} ${chalk.gray(new Date().toISOString())} ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`${chalk.red('❌')} ${chalk.gray(new Date().toISOString())} ${message}`, ...args);
  },
};

module.exports = logger;
