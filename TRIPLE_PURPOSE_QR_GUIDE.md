# 🎯 Triple-Purpose QR Code System

## Overview
The QR codes on each table now serve **three different purposes** based on the order status, creating a seamless customer experience.

## 🔄 QR Code States

### 1. **Menu Mode** 📋
- **When**: First scan, no active orders
- **What happens**: Customer sees the menu and can place orders
- **Customer experience**: Browse menu, add items to cart, place order

### 2. **Order Tracker Mode** 📊
- **When**: After order placed, before served (pending → preparing → ready)
- **What happens**: Customer sees real-time order status and progress
- **Customer experience**: Track order progress, see estimated time, get notifications

### 3. **Bill Mode** 💳
- **When**: After order status changed to "served"
- **What happens**: Customer sees bill with payment options
- **Customer experience**: View total, pay, complete dining experience

## 🚀 How It Works

### **Automatic Mode Detection**
The system automatically determines which mode to show based on:
1. **Table UUID** from QR code
2. **Active orders** for that table
3. **Latest order status**

### **Mode Logic**
```javascript
if (no active orders) {
  return 'menu'
} else if (latestOrder.status === 'served') {
  return 'bill'
} else {
  return 'tracker' // pending, preparing, ready
}
```

### **Real-Time Updates**
- **Order status changes** trigger automatic mode switches
- **QR code scans** always show the current appropriate mode
- **No manual intervention** required from customers

## 📱 Customer Journey

### **First Visit**
1. Scan QR code → **Menu Mode**
2. Place order → **Order Tracker Mode**
3. Order served → **Bill Mode**
4. Pay → Return to **Menu Mode** (for new orders)

### **Return Visit (Same Session)**
1. Scan QR code → **Order Tracker Mode** (if order pending)
2. Scan QR code → **Bill Mode** (if order served)
3. Scan QR code → **Menu Mode** (if no active orders)

## 🛠️ Staff Workflow

### **Order Status Updates**
Staff can update order status in the dashboard:
- `pending` → `preparing` → `ready` → `served` → `completed`

### **Automatic Customer Notifications**
- **Status changes** trigger real-time updates
- **Mode switches** happen automatically
- **Toast notifications** inform customers

## 🎨 User Experience Benefits

### **Seamless Flow**
- No need to navigate between different pages
- QR code always shows the right information
- Automatic transitions between modes

### **Real-Time Updates**
- Live order status tracking
- Progress indicators
- Time estimates
- Status change notifications

### **Contextual Information**
- Menu when ready to order
- Order status when waiting
- Bill when ready to pay

## 🔧 Technical Implementation

### **URL Parameters**
- `/?tableId={uuid}&mode=menu` - Menu mode
- `/?tableId={uuid}&mode=tracker&orderId={orderId}` - Tracker mode
- `/?tableId={uuid}&mode=bill` - Bill mode

### **Real-Time Subscriptions**
- Supabase real-time updates for order status
- Automatic mode switching
- Live notifications

### **State Management**
- RestaurantContext handles mode transitions
- OrderTracker component for status display
- Automatic cleanup and navigation

## 🎯 Benefits

1. **Improved Customer Experience** - Always see relevant information
2. **Reduced Confusion** - No manual navigation required
3. **Real-Time Updates** - Live status tracking
4. **Seamless Transitions** - Automatic mode switching
5. **Contextual Information** - Right info at the right time

## 🚀 Future Enhancements

- **Push notifications** for status changes
- **Estimated wait times** based on kitchen capacity
- **Order history** for repeat customers
- **Loyalty program** integration
- **Payment processing** integration 