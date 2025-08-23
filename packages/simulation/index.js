import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load the native addon
const addon = require(path.join(__dirname, 'build', 'addon.node'));

export const simulate = addon.simulate;
export default { simulate };