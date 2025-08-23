import type { NextConfig } from 'next';
import { fileURLToPath } from 'url'
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDirectory = path.dirname(path.dirname(__dirname));

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDirectory
  }
};

export default nextConfig;
