#!/usr/bin/env node
/**
 * SurgePulse PHV - Model Context Protocol (MCP) Stdio Server
 * 
 * You can configure this in Claude Desktop `claude_desktop_config.json`:
 * {
 *   "mcpServers": {
 *     "surgepulse-phv": {
 *       "command": "npx",
 *       "args": ["-y", "tsx", "/path/to/project/mcp-server.ts"]
 *     }
 *   }
 * }
 */

import * as readline from 'readline';
import { processMcpJsonRpc } from './src/services/mcpEngine';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);
    const response = await processMcpJsonRpc(request);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (err: any) {
    const errResponse = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` },
    };
    process.stdout.write(JSON.stringify(errResponse) + '\n');
  }
});
