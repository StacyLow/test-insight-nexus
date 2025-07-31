import { MongoClient, Db } from 'mongodb';
import { TestEntry } from '@/types/test-data';

class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(uri: string = 'mongodb://localhost:27017'): Promise<void> {
    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db('testdb');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  async getTestResults(
    startDate: Date,
    endDate: Date,
    testType?: string
  ): Promise<TestEntry[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const collection = this.db.collection<TestEntry>('test_results');
      
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

      const results = await collection.find(query).toArray();
      return results;
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  }

  async insertTestResult(testResult: TestEntry): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const collection = this.db.collection<TestEntry>('test_results');
      await collection.insertOne(testResult);
    } catch (error) {
      console.error('Error inserting test result:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();