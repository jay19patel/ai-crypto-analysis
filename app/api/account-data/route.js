import clientPromise from '../../lib/mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db('crypto_analysis');
    
    // Fetch account data
    const accounts = await db.collection('accounts').find({}).toArray();
    const account = accounts.length > 0 ? accounts[0] : null;

    return Response.json({
      success: true,
      account: account
    });
  } catch (error) {
    console.error('Error fetching account data:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { page = 1, limit = 10, status = 'CLOSED', filters = {} } = await request.json();
    const client = await clientPromise;
    const db = client.db('crypto_analysis');
    
    // Build filter query
    let query = {};
    if (status === 'OPEN') {
      query.status = { $ne: 'CLOSED' };
    } else if (status === 'CLOSED') {
      query.status = 'CLOSED';
    }

    // Add additional filters
    if (filters.position_type) {
      query.position_type = filters.position_type;
    }
    
    if (filters.symbol) {
      query.symbol = { $regex: filters.symbol, $options: 'i' };
    }

    // PnL filters
    if (filters.minPnl !== undefined && filters.minPnl !== '') {
      query.pnl = { ...query.pnl, $gte: parseFloat(filters.minPnl) };
    }
    if (filters.maxPnl !== undefined && filters.maxPnl !== '') {
      query.pnl = { ...query.pnl, $lte: parseFloat(filters.maxPnl) };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Fetch positions with pagination
    const positions = await db.collection('positions')
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await db.collection('positions').countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get unique values for filters
    const uniqueSymbols = await db.collection('positions').distinct('symbol');
    const uniquePositionTypes = await db.collection('positions').distinct('position_type');

    return Response.json({
      success: true,
      positions: positions,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit
      },
      uniqueValues: {
        symbols: uniqueSymbols,
        positionTypes: uniquePositionTypes
      }
    });
  } catch (error) {
    console.error('Error fetching positions data:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 