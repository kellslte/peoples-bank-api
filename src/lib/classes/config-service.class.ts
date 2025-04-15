import { config } from "dotenv";

class ConfigService {
  constructor() {
    config();
  }

  get(key: string): string|undefined {
    return process.env[key.toUpperCase()];
  }

  getOrThrow(key: string): string {
    const value = this.get(key);
    if (!value) throw new Error(`Missing required environment variable ${key}`);
    return value;
  }

  getEnvironment(): string {
    return this.getOrThrow("node_env");
  }
}

export default new ConfigService();
