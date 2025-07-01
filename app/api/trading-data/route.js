import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      page = 1, 
      limit = 20, 
      searchTerm = '', 
      filters = {} 
    } = body;

    console.log('API Request:', { page, limit, searchTerm, filters });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'crypto_analysis');
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'analysis_results');

    // Build MongoDB query
    const query = {};

    // Add search functionality
    if (ObjectId.isValid(searchTerm)) {
      query._id = new ObjectId(searchTerm);
    } else if (searchTerm && searchTerm.trim() !== '') {
      query.$or = [
        { 'analysis_data.symbol': { $regex: searchTerm, $options: 'i' } },
        { 'analysis_data.ai_analysis.summary': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Add filters
    if (filters.symbol && filters.symbol !== '') {
      query['analysis_data.symbol'] = filters.symbol;
    }

    if (filters.signal && filters.signal !== '') {
      query['analysis_data.consensus.signal'] = filters.signal;
    }

    if (filters.trend && filters.trend !== '') {
      query['analysis_data.ai_analysis.current_trend'] = filters.trend;
    }

    if (filters.recommendation && filters.recommendation !== '') {
      query['analysis_data.ai_analysis.recommendation'] = filters.recommendation;
    }

    console.log('MongoDB Query:', JSON.stringify(query, null, 2));

    // Get total count for pagination
    const totalCount = await collection.countDocuments(query);

    // Get paginated data
    const skip = (page - 1) * limit;
    const data = await collection
      .find(query)
      .sort({ timestamp: -1 }) // Latest first
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get unique values for filters (for dropdowns)
    const uniqueValues = await Promise.all([
      collection.distinct('analysis_data.symbol'),
      collection.distinct('analysis_data.consensus.signal'),
      collection.distinct('analysis_data.ai_analysis.current_trend'),
      collection.distinct('analysis_data.ai_analysis.recommendation')
    ]);

    const response = {
      success: true,
      data: data,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
      uniqueValues: {
        symbols: uniqueValues[0] || [],
        signals: uniqueValues[1] || [],
        trends: uniqueValues[2] || [],
        recommendations: uniqueValues[3] || []
      }
    };

    console.log('API Response:', {
      totalCount: response.totalCount,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
      dataLength: response.data.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('MongoDB Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trading data',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// GET method for basic health check
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'crypto_analysis');
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'analysis_results');
    
    const totalDocuments = await collection.countDocuments();
    
    return NextResponse.json({
      status: 'Connected to MongoDB',
      database: process.env.MONGODB_DB || 'crypto_analysis',
      collection: process.env.MONGODB_COLLECTION || 'analysis_results',
      totalDocuments: totalDocuments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    return NextResponse.json(
      { 
        status: 'Failed to connect to MongoDB',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
} 