import { MongoClient, Db, Collection } from 'mongodb';
import { TestEntry } from '@/types/test-data';
import { config } from '@/lib/config';

class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  private log(message: string, data?: any) {
    if (config.debugDatabase) {
      console.log(`[DatabaseService] ${message}`, data || '');
    }
  }

  private logError(message: string, error: any) {
    console.error(`[DatabaseService] ${message}`, error);
  }

  async connect(): Promise<void> {
    this.log('Attempting to connect to MongoDB', {
      uri: config.mongodb.uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
      database: config.mongodb.database,
      collection: config.mongodb.collection,
      environment: config.isDevelopment ? 'development' : 'production'
    });

    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        throw new Error('MongoDB client cannot be used in browser environment. Need backend API.');
      }

      this.client = new MongoClient(config.mongodb.uri);
      await this.client.connect();
      this.db = this.client.db(config.mongodb.database);
      this.isConnected = true;
      this.log('Successfully connected to MongoDB');
    } catch (error) {
      this.logError('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  async getTestResults(
    startDate: Date,
    endDate: Date,
    testType?: string
  ): Promise<TestEntry[]> {
    this.log('Fetching test results', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      testType,
      isConnected: this.isConnected
    });

    if (!this.isConnected || !this.db) {
      await this.connect();
    }

    try {
      const collection: Collection<TestEntry> = this.db!.collection(config.mongodb.collection);
      
      const query: any = {
        start: {
          $gte: startDate.getTime() / 1000,
          $lte: endDate.getTime() / 1000
        }
      };

      // Add test type filter if specified
      if (testType && testType !== 'All') {
        const typeMap: Record<string, string[]> = {
          'Meter Test': ['decabit', 'telenerg'],
          'MCB Test': ['mcb'],
          'RCD Test': ['rcd']
        };
        
        const patterns = typeMap[testType] || [];
        if (patterns.length > 0) {
          query.name = {
            $regex: patterns.join('|'),
            $options: 'i'
          };
        }
      }

      this.log('Executing MongoDB query', query);
      const results = await collection.find(query).toArray();
      this.log(`Found ${results.length} test results`);
      return results;
    } catch (error) {
      this.logError('Error fetching test results', error);
      throw error;
    }
  }

  async insertTestResult(testResult: TestEntry): Promise<void> {
    if (!this.isConnected || !this.db) {
      await this.connect();
    }

    try {
      const collection: Collection<TestEntry> = this.db!.collection(config.mongodb.collection);
      await collection.insertOne(testResult);
      console.log('Test result inserted successfully');
    } catch (error) {
      console.error('Failed to insert test result:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();