import { config } from "dotenv";

class ConfigService {
  constructor() {
    config();
  }

  get(key: string) {
    return process.env[key.toUpperCase()];
  }

  getOrThrow(key: string) {
    const value = this.get(key);
    if (!value) throw new Error(`Missing required environment variable ${key}`);
    return value;
  }
}

export default new ConfigService();
