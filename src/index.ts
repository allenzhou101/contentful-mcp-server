#!/usr/bin/env node

// Register Observable polyfill before any other imports
import 'any-observable/register/rxjs';

import express, { Request, Response } from 'express';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerAllPrompts } from './prompts/register.js';
import { registerAllResources } from './resources/register.js';
import { registerAllTools } from './tools/register.js';
import { VERSION } from './config/version.js';

if (process.env.NODE_ENV === 'development') {
  try {
    await import('mcps-logger/console');
  } catch {
    console.warn('mcps-logger not available in production environment');
  }
}

const MCP_SERVER_NAME = '@contentful/mcp-server';

function getServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: VERSION,
  });

  registerAllTools(server);
  registerAllPrompts(server);
  registerAllResources(server);

  return server;
}

async function initializeServer() {
  return getServer();
}

async function runStdioServer() {
  try {
    const server = await initializeServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error('Fatal error in stdio mode:', error);
    process.exit(1);
  }
}

async function runHttpServer() {
  try {
    const app = express();

    // Enable CORS for all origins
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // Parse JSON bodies
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        name: MCP_SERVER_NAME,
        version: VERSION,
        timestamp: new Date().toISOString(),
      });
    });

    app.post('/mcp', async (req: Request, res: Response) => {
      // In stateless mode, create a new instance of transport and server for each request
      // to ensure complete isolation. A single instance would cause request ID collisions
      // when multiple clients connect concurrently.

      try {
        const server = getServer();
        const transport: StreamableHTTPServerTransport =
          new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
        res.on('close', () => {
          console.log('Request closed');
          transport.close();
          server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // SSE notifications not supported in stateless mode
    app.get('/mcp', async (req: Request, res: Response) => {
      console.log('Received GET MCP request');
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        }),
      );
    });

    // Session termination not needed in stateless mode
    app.delete('/mcp', async (req: Request, res: Response) => {
      console.log('Received DELETE MCP request');
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        }),
      );
    });

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(
        `MCP Stateless Streamable HTTP Server listening on port ${PORT}`,
      );
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    });
  } catch (error) {
    console.error('Failed to set up the server:', error);
    process.exit(1);
  }
}

async function main() {
  // Check if we should run in HTTP mode
  const isHttpMode =
    process.env.MCP_HTTP_MODE === 'true' || process.argv.includes('--http');

  if (isHttpMode) {
    console.log('Starting MCP server in HTTP mode...');
    await runHttpServer();
  } else {
    console.log('Starting MCP server in stdio mode...');
    await runStdioServer();
  }
}

main();
