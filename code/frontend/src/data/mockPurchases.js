/**
 * Mock purchase data — used as the initial UI state before the first Sync Inbox.
 * The backend returns the same shape; dates are ISO strings and converted to Date
 * objects in App.jsx when the API response arrives.
 */

const now = new Date()
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)

export const mockPurchases = [
  {
    id: '1',
    productName: 'Samsung 65" Class QN90F Series Neo QLED 4K Smart TV',
    price: 1299.99,
    retailer: 'Best Buy',
    purchaseDate: daysAgo(12),
    returnWindowDays: 15,
    warrantyMonths: 12,
    currency: 'USD',
  },
  {
    id: '2',
    productName: 'Canon EOS R50 4K Video Mirrorless Camera',
    price: 699.99,
    retailer: 'Best Buy',
    purchaseDate: daysAgo(8),
    returnWindowDays: 15,
    warrantyMonths: 12,
    currency: 'USD',
  },
  {
    id: '3',
    productName: 'Sony WH-1000XM5 Wireless Headphones',
    price: 399.99,
    retailer: 'Amazon',
    purchaseDate: daysAgo(45),
    returnWindowDays: 30,
    warrantyMonths: 12,
    currency: 'USD',
  },
  {
    id: '4',
    productName: 'Oura Ring 4 Midnight Ceramic - Size 7',
    price: 449.99,
    retailer: 'Oura',
    purchaseDate: daysAgo(1),
    returnWindowDays: 30,
    warrantyMonths: 24,
    currency: 'USD',
  },
  {
    id: '5',
    productName: 'Oura Ring 4 Midnight Ceramic - Size 8',
    price: 449.99,
    retailer: 'Oura',
    purchaseDate: daysAgo(1),
    returnWindowDays: 30,
    warrantyMonths: 24,
    currency: 'USD',
  },
]
