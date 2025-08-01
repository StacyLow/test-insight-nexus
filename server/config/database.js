import { MongoClient } from 'mongodb';

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/testdb';
      const database = process.env.MONGODB_DATABASE_NAME || 'testdb';
      
      console.log(`Connecting to MongoDB: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
      
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(database);
      this.isConnected = true;
      
      console.log('Successfully connected to MongoDB');
      return this.db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  getDb() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }
}

export const databaseService = new DatabaseService();