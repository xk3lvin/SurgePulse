import type { IncomingMessage, ServerResponse } from 'http';
import { processMcpJsonRpc } from '../src/services/mcpEngine';

// Serverless handler for Vercel /api/mcp
export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return server description and available tools
    return res.status(200).json({
      name: 'surgepulse-phv-mcp',
      description: 'SurgePulse PHV & Taxi Driver Intelligence MCP Server',
      endpoint: '/api/mcp',
      protocol: 'Model Context Protocol (JSON-RPC 2.0)',
      status: 'online',
      sampleRequest: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request: Only POST (JSON-RPC) and GET are supported' },
    });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const response = await processMcpJsonRpc(payload);
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: error.message || 'Internal server error' },
    });
  }
}
