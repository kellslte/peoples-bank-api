import configServiceClass from "@/lib/classes/config-service.class";
import mongoose from "mongoose";

export default class DatabaseProvider {
  private static instance: DatabaseProvider;
  private readonly dbUri: string;

  private constructor() {
    this.dbUri = configServiceClass.getOrThrow("mongodb_uri");
  }

  public static getInstance(): DatabaseProvider {
    if (!DatabaseProvider.instance) {
      DatabaseProvider.instance = new DatabaseProvider();
    }
    return DatabaseProvider.instance;
  }

  public async connect(): Promise<void> {
    try {
      mongoose.connect(this.dbUri);
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection error:", error);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("Database disconnected successfully");
    } catch (error) {
      console.error("Database disconnection error:", error);
    }
  }
}