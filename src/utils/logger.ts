import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * MCP log level type
 */
export type LogLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error';

/**
 * Logger class using MCP Logging Notification
 * This logger uses MCP protocol's Logging Notification to send logs, which are automatically captured and displayed by MCP Hosts.
 *
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/logging
 */
class Logger {
  private server: McpServer | null = null;

  /**
   * Initialize logger with MCP Server instance
   * This method should be called once during initialization in server.ts
   */
  init(server: McpServer): void {
    this.server = server;
  }

  /**
   * Send MCP Logging Notification
   *
   * @param level - Log level (debug, info, notice, warning, error)
   * @param data - Log data (string or JSON-serializable object)
   */
  log(level: LogLevel, data: unknown): void {
    const formatted = this.formatData(data);

    if (!this.server?.server) {
      const timestamp = new Date().toISOString();
      const dataStr = typeof formatted === 'string' ? formatted : JSON.stringify(formatted);
      process.stderr.write(`[${timestamp}] [${level.toUpperCase()}]: ${dataStr}\n`);
      return;
    }

    void this.server.server.sendLoggingMessage({ level, data: formatted });
  }

  /**
   * Format data for JSON serialization
   * Recursively traverses objects/arrays and converts any Error instance (at any
   * depth) to a serializable format. This is required because Error's own
   * `message`/`stack` properties are non-enumerable, so a nested Error would
   * otherwise serialize to `{}` via JSON.stringify.
   */
  private formatData(data: unknown): unknown {
    if (data instanceof Error) {
      return {
        error: data.message,
        name: data.name,
      };
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.formatData(item));
    }
    if (data !== null && typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, this.formatData(value)]),
      );
    }
    return data;
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();
