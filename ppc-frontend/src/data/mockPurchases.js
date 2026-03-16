/**
 * Mock purchase data for the Post-Purchase Concierge UI.
 * Replace with API calls to your Python/FastAPI backend when ready.
 */

const now = new Date();

export const mockPurchases = [
  {
    id: '1',
    productName: 'Samsung 65" Class QLED 4K Smart TV',
    price: 1299.99,
    retailer: 'Best Buy',
    purchaseDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    returnWindowDays: 15,
    warrantyMonths: 12,
    currency: 'USD',
  },
  {
    id: '2',
    productName: 'Canon EOS R50 Mirrorless Camera',
    price: 699.99,
    retailer: 'Best Buy',
    purchaseDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    returnWindowDays: 15,
    warrantyMonths: 12,
    currency: 'USD',
  },
  {
    id: '3',
    productName: 'Sony WH-1000XM5 Wireless Headphones',
    price: 399.99,
    retailer: 'Amazon',
    purchaseDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    returnWindowDays: 30,
    warrantyMonths: 12,
    currency: 'USD',
  },
];

export const mockAgentResponse = {
  question: 'My TV has a dead pixel, am I still covered?',
  reasoning: 'Your Samsung 65" TV was purchased 12 days ago. Best Buy\'s standard return window is 15 days for most electronics. A dead pixel typically qualifies as a defect, so you are within the return window and can request an exchange or refund.',
  response: 'Yes, you are still covered. You have 3 days left in your return window. We recommend visiting a Best Buy store or contacting their support to initiate an exchange for the defective unit. Bring your receipt or order confirmation.',
  sources: [
    { label: 'Best Buy Return Policy', url: 'https://www.bestbuy.com/site/help-topics/return-exchange-policy/pcmcat260800050014.c?id=pcmcat260800050014' },
    { label: 'Best Buy Electronics Returns', url: 'https://www.bestbuy.com/site/help-topics/return-exchange-policy/pcmcat260800050014.c?id=pcmcat260800050014#electronics' },
  ],
  timestamp: new Date().toISOString(),
};
