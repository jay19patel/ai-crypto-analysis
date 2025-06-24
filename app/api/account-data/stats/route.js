import clientPromise from '../../../lib/mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db('crypto_analysis');
    const positionsCollection = db.collection('positions');

    const stats = await positionsCollection.aggregate([
      {
        $match: { status: 'CLOSED' }
      },
      {
        $group: {
          _id: null,
          maxProfit: { $max: "$pnl" },
          maxLoss: { $min: "$pnl" },
          totalPositivePnl: {
            $sum: {
              $cond: [{ $gt: ["$pnl", 0] }, "$pnl", 0]
            }
          },
          totalNegativePnl: {
            $sum: {
              $cond: [{ $lt: ["$pnl", 0] }, "$pnl", 0]
            }
          },
        }
      }
    ]).toArray();

    const result = stats.length > 0 ? stats[0] : {
      maxProfit: 0,
      maxLoss: 0,
      totalPositivePnl: 0,
      totalNegativePnl: 0
    };
    
    // If maxLoss is positive (which means no losing trades), it should be 0
    if (result.maxLoss > 0) {
        result.maxLoss = 0;
    }

    return Response.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching position stats:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 