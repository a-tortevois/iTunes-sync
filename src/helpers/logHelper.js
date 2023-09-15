import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { __dirname } from '../constants.js';
import { isFileExists } from './fsHelper.js';

const logFilePath = path.join(__dirname, '../.cache/log.txt');

/**
 * @class
 */
class LogHelper {
  /**
   * @constructor
   * @private
   */
  constructor() {
    this.logStream = null;
  }

  /**
   * @returns {LogHelper}
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new LogHelper();
    }
    return this.instance;
  }

  /**
   * @returns {void}
   */
  async init() {
    const isLogFileExists = await isFileExists(logFilePath);
    if (isLogFileExists) {
      this.add('Clean log file', 'log');
      await rm(logFilePath);
    }
    this.logStream = createWriteStream(logFilePath, { flags: 'a+' });
  }

  /**
   * @param {string} message
   * @param {'log' | 'info' | 'error'} level
   * @returns {void}
   */
  add(message, level = 'log') {
    switch (level) {
      case 'log': {
        console.log(message);
        break;
      }
      case 'info': {
        console.info(message);
        break;
      }
      case 'error': {
        console.error(message);
        break;
      }
      default: {
        throw new Error(`LogHelper: unknown log level "${level}'`);
      }
    }
    if (this.logStream) {
      this.logStream.write(`${new Date().toISOString()}\t[${level.toUpperCase()}]\t${message}\n`);
    }
  }
}

export const logHelper = LogHelper.getInstance();
