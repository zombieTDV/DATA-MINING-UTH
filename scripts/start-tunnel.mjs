import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const PORT = process.env.GATEWAY_PORT || 8000;
const BIN_DIR = path.resolve(process.cwd(), 'bin');
const IS_WINDOWS = process.platform === 'win32';
const BINARY_NAME = IS_WINDOWS ? 'cloudflared.exe' : 'cloudflared';
const BINARY_PATH = path.join(BIN_DIR, BINARY_NAME);

function getDownloadUrl() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
  } else if (platform === 'darwin') {
    return arch === 'arm64'
      ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz'
      : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz';
  } else {
    // Linux
    return arch === 'arm64'
      ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64'
      : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
  }
}

async function ensureCloudflared() {
  if (fs.existsSync(BINARY_PATH)) {
    return;
  }

  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  const downloadUrl = getDownloadUrl();
  console.log(`[tunnel] cloudflared binary not found in ./bin.`);
  console.log(`[tunnel] Downloading official Cloudflare Tunnel binary from:`);
  console.log(`         ${downloadUrl}`);

  const res = await fetch(downloadUrl);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download cloudflared: HTTP ${res.status} ${res.statusText}`);
  }

  const fileStream = fs.createWriteStream(BINARY_PATH, { mode: 0o755 });
  // @ts-ignore
  await pipeline(Readable.fromWeb(res.body), fileStream);

  if (!IS_WINDOWS) {
    fs.chmodSync(BINARY_PATH, 0o755);
  }
  console.log(`[tunnel] Binary downloaded successfully to ${BINARY_PATH}\n`);
}

async function startTunnel() {
  await ensureCloudflared();

  console.log(`[tunnel] Launching Cloudflare Tunnel for http://localhost:${PORT}...`);
  console.log(`[tunnel] Please ensure your API Gateway is running (npm run start:gateway or npm run dev)\n`);

  const child = spawn(BINARY_PATH, ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let tunnelFound = false;

  const handleOutput = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);

    if (match && !tunnelFound) {
      tunnelFound = true;
      const publicUrl = match[0];

      console.log('\n' + '='.repeat(68));
      console.log('🚀 CLOUDFLARE REVERSE TUNNEL IS ACTIVE!');
      console.log('='.repeat(68));
      console.log(`🔗 Public API Gateway : ${publicUrl}`);
      console.log(`📖 Swagger API Docs    : ${publicUrl}/api/docs`);
      console.log(`🔍 OpenAPI JSON Spec   : ${publicUrl}/api/docs-json`);
      console.log('-'.repeat(68));
      console.log('📋 Share this with your frontend teammate:');
      console.log(`   VITE_API_URL=${publicUrl}`);
      console.log('='.repeat(68) + '\n');
      console.log('[tunnel] Streaming traffic to http://localhost:' + PORT + ' (Press Ctrl+C to close)\n');
    }
  };

  child.stdout.on('data', handleOutput);
  child.stderr.on('data', handleOutput);

  child.on('error', (err) => {
    console.error(`[tunnel] Error starting process: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    console.log(`[tunnel] Tunnel process exited with code ${code}`);
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    console.log('\n[tunnel] Shutting down tunnel...');
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
}

startTunnel().catch((err) => {
  console.error(`[tunnel] Fatal error: ${err.message}`);
  process.exit(1);
});
