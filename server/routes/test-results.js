import express from 'express';
import { databaseService } from '../config/database.js';

const router = express.Router();

// Get test results with optional filters
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, testType } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Ensure database connection
    if (!databaseService.isConnected) {
      await databaseService.connect();
    }

    const db = databaseService.getDb();
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME || 'test_results');
    
    // Build query
    const query = {
      start: {
        $gte: new Date(startDate).getTime() / 1000,
        $lte: new Date(endDate).getTime() / 1000
      }
    };

    // Add test type filter if specified
    if (testType && testType !== 'All') {
      const typeMap = {
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

    console.log('Executing query:', JSON.stringify(query, null, 2));
    
    const results = await collection.find(query).toArray();
    console.log(`Found ${results.length} test results`);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Add new test result
router.post('/', async (req, res) => {
  try {
    const testResult = req.body;
    
    if (!databaseService.isConnected) {
      await databaseService.connect();
    }

    const db = databaseService.getDb();
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME || 'test_results');
    
    const result = await collection.insertOne(testResult);
    console.log('Test result inserted successfully:', result.insertedId);
    
    res.status(201).json({ id: result.insertedId, message: 'Test result created successfully' });
  } catch (error) {
    console.error('Error inserting test result:', error);
    res.status(500).json({ error: 'Failed to insert test result' });
  }
});

export default router;