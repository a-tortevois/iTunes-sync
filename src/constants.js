import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const iTunesPath = 'D:\\Music\\iTunes\\iTunes Media\\Music';
export const iTunesMusicLibraryXmlFile = 'D:\\Music\\iTunes\\iTunes Music Library.xml';
export const oneDrivePath = 'D:\\OneDrive\\Musiques';
export const musicFileExt = ['.aiff', '.m4a', '.mp3'];

export const localhostPath = 'file://localhost/';
