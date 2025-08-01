# Dual-Purpose QR Code System Guide

## Overview

The QR code system now supports dual functionality based on the meal status:

- **Before Meal**: QR code shows the menu for ordering
- **After Meal**: When order status is "served", QR code shows the bill for payment

## How It Works

### 1. QR Code Scanning Process

When a customer scans the QR code:

1. The system automatically detects the table number from the QR code
2. It checks the current order status for that table
3. Based on the status, it determines whether to show:
   - **Menu Mode**: If no active orders or order status is not "served"
   - **Bill Mode**: If there's an active order with status "served"

### 2. Order Status Flow

```
pending → preparing → ready → served → completed
   ↓         ↓         ↓        ↓         ↓
  Menu     Menu     Menu    Bill     Completed
```

### 3. Staff Workflow

1. **Order Received**: Status = "pending" (QR shows menu)
2. **Kitchen Prepares**: Status = "preparing" (QR shows menu)
3. **Order Ready**: Status = "ready" (QR shows menu)
4. **Order Served**: Status = "served" (QR shows bill) ← **Key Change**
5. **Payment Complete**: Status = "completed" (Order archived)

### 4. Customer Experience

#### Before Meal (Menu Mode)
- Scan QR code → View menu
- Select items and quantities
- Place order
- Track order status

#### After Meal (Bill Mode)
- Scan same QR code → View bill
- See order details and total
- Call waiter if needed
- Make payment

## Technical Implementation

### Database Changes
- QR codes now contain JSON data: `{"tableId": "5", "type": "dual-purpose"}`
- Orders table supports "served" status

### Component Updates
- `QRCodeScanner`: Automatically detects mode based on order status
- `StaffDashboard`: Added "Mark Served" button
- `BillDisplay`: Updated to handle "served" status
- Status colors and messages updated for "served" status

### Key Functions

#### Mode Detection Logic
```typescript
const determineMode = async (tableId: string): Promise<'menu' | 'bill'> => {
  // Check for active orders with status 'served'
  if (orderData && orderData.length > 0) {
    const latestOrder = orderData[0];
    if (latestOrder.status === 'served') {
      return 'bill';
    }
  }
  return 'menu';
};
```

## Testing the System

### Manual Testing Steps

1. **Test Menu Mode**:
   - Enter any table number (e.g., "5")
   - Should show menu interface
   - Place an order

2. **Test Bill Mode**:
   - In staff dashboard, change order status to "served"
   - Scan the same table QR code again
   - Should show bill interface

3. **Test Status Transitions**:
   - pending → preparing → ready → served → completed
   - Verify QR behavior at each stage

### Demo Instructions

1. Enter table number "5" in QR scanner
2. Place an order through the menu
3. Go to staff dashboard and mark order as "served"
4. Return to QR scanner and scan table "5" again
5. Should now show bill instead of menu

## Benefits

1. **Single QR Code**: No need for separate menu and bill QR codes
2. **Automatic Detection**: System intelligently determines what to show
3. **Seamless Experience**: Customers use the same QR code throughout their meal
4. **Staff Efficiency**: Clear workflow with "served" status
5. **Reduced Confusion**: No manual mode selection needed

## Future Enhancements

- Real camera QR scanning integration
- Push notifications for order status changes
- Payment gateway integration
- Analytics on QR scan patterns
- Multi-language support 