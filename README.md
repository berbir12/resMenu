# ResMenu - Restaurant Menu & QR Code System

A modern restaurant management system built with React, TypeScript, and Supabase. Features QR code generation for tables, digital menu display, order management, and staff dashboard.

## 🍽️ Features

- **QR Code System**: Generate unique QR codes for each table
- **Digital Menu**: Interactive menu display with categories and items
- **Order Management**: Real-time order tracking and management
- **Staff Dashboard**: Comprehensive dashboard for restaurant staff
- **Admin Panel**: Full administrative control over menu, tables, and orders
- **Authentication**: Secure user authentication with Supabase
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or bun
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/berbir12/resMenu.git
   cd resMenu
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=your_app_url
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
resMenu/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── MenuDisplay.tsx # Menu rendering component
│   │   ├── QRCodeScanner.tsx # QR code scanning
│   │   ├── QRCodeGenerator.tsx # QR code generation
│   │   ├── BillDisplay.tsx # Order bill display
│   │   └── ErrorBoundary.tsx # Error handling
│   ├── pages/              # Application pages
│   │   ├── Index.tsx       # Landing page
│   │   ├── AdminPanel.tsx  # Admin dashboard
│   │   ├── StaffDashboard.tsx # Staff interface
│   │   ├── AuthPage.tsx    # Authentication
│   │   ├── TablePage.tsx   # Table-specific view
│   │   └── QRCodeAdminPage.tsx # QR management
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External services
│   │   └── supabase/       # Supabase configuration
│   ├── lib/                # Utility functions
│   └── assets/             # Images and static files
├── supabase/               # Database migrations
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🛠️ Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **QR Codes**: qrcode library
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 🎯 Key Features Explained

### QR Code System
- Generate unique QR codes for each table
- Customers scan QR codes to access the menu
- Direct link to table-specific ordering interface

### Digital Menu
- Categorized menu items with descriptions
- Real-time pricing updates
- Image support for menu items
- Mobile-optimized interface

### Order Management
- Real-time order tracking
- Order status updates
- Bill generation and display
- Payment integration ready

### Admin Panel
- Menu item management (add, edit, delete)
- Table management
- Order overview and management
- User management
- Analytics and reporting

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Build the Application
```bash
npm run build
```


- **Vercel**: Connect your GitHub repository

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_APP_URL` | Your application URL | Yes |

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices. The QR code scanning feature works best on mobile devices with cameras.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/berbir12/resMenu/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error messages

## 🔄 Recent Updates

- ✅ Cleaned up unused UI components
- ✅ Removed development/test files
- ✅ Optimized project structure
- ✅ Updated dependencies
- ✅ Improved documentation
- ✅ Fixed QR code routing for mobile

---

**Built with ❤️ for modern restaurants**