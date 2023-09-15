import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { XMLParser, XMLBuilder } from 'fast-xml-parser';

import { __dirname, iTunesMusicLibraryXmlFile } from '../constants.js';

/**
 * @typedef {Object} ITunesMusicLibraryElem
 * @property {string[]} key
 * @property {number} integer
 * @property {string[]} date
 * @property {string[]} string
 * @property {string} true
 */

/**
 * @class
 */
class ITunesMusicLibrary {
  /**
   * @constructor
   * @private
   */
  constructor() {
    this.xmlParser = new XMLParser();
    this.xmlBuilder = new XMLBuilder();
  }

  /**
   * @returns {ITunesMusicLibrary}
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new ITunesMusicLibrary();
    }
    return this.instance;
  }

  /**
   * @returns {Promise<ITunesMusicLibraryElem[]>}
   */
  async load() {
    /** @type {string} */
    let xmlContent = await readFile(iTunesMusicLibraryXmlFile);
    const xmlData = this.xmlParser.parse(xmlContent);
    /** @type ITunesMusicLibraryElem[] */
    const iTunesMusicLibraryElems = xmlData.plist.dict.dict.dict;
    // Ensure we have strings
    iTunesMusicLibraryElems.forEach((elem) => {
      elem.string = elem.string.map((str) => str.toString());
    });
    await writeFile(path.join(__dirname, '../.cache/iTunesMusicLibrary.json'), JSON.stringify(iTunesMusicLibraryElems, null, 2));
    return iTunesMusicLibraryElems;
  }

  /**
   * @param {ITunesMusicLibraryElem[]} xmlData
   * @returns {Promise<void>}
   */
  async save(xmlData) {
    const xmlContent = this.xmlBuilder.build(xmlData);
    await writeFile(path.join(__dirname, '../.cache/iTunesMusicLibrary.xml'), xmlContent);
    await writeFile(iTunesMusicLibraryXmlFile, xmlContent);
  }
}

export const iTunesMusicLibraryHelper = ITunesMusicLibrary.getInstance();
