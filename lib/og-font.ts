import { readFile } from 'fs/promises';
import path from 'path';

/** Bebas Neue (SIL OFL, see assets/fonts/BebasNeue-OFL.txt) for generated images. */
export function loadBebasNeue(): Promise<Buffer> {
  return readFile(path.join(process.cwd(), 'assets/fonts/BebasNeue-Regular.woff'));
}
