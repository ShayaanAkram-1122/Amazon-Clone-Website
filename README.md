# Amazon Clone

A modern, responsive Amazon clone built with HTML, CSS, JavaScript, and Node.js. Features a complete e-commerce experience with user authentication, product management, shopping cart, and order processing.

## Features

### E-commerce Features
- Product Catalog: Browse through a comprehensive product catalog
- Search & Filter: Advanced search with multiple sorting options
- Shopping Cart: Add, remove, and manage cart items
- Checkout Process: Complete checkout with shipping and payment
- Order Management: Track orders and view order history
- Returns System: Process returns and refunds

### User Management
- User Registration & Login: Secure authentication system
- Profile Management: Update personal information and preferences
- Settings Dashboard: Comprehensive settings with global preferences
- Password Reset: Forgot password functionality
- Admin Panel: Admin dashboard for product and user management

### UI/UX Features
- Responsive Design: Works perfectly on desktop, tablet, and mobile
- Dark/Light Theme: Toggle between themes with global settings
- Modern Animations: Smooth transitions and hover effects
- Amazon-like Design: Authentic Amazon styling and layout

### Technical Features
- Global Settings: Theme and preferences apply across all pages
- Local Storage: Persistent user data and settings
- Real-time Updates: Live cart updates and notifications
- Cross-browser Support: Works on all modern browsers
- Performance Optimized: Fast loading and smooth interactions

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Git (for cloning the repository)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/amazon-clone.git
   cd amazon-clone
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

4. Open your browser
   Navigate to `http://localhost:3000`

## Project Structure

```
amazon-clone/
├── backend/                 # Node.js server files
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── products.json       # Product data
├── data/                   # Frontend data files
│   ├── cart.js            # Cart functionality
│   ├── products.js        # Product data
│   └── deliveryOptions.js # Shipping options
├── images/                 # Image assets
│   ├── icons/             # UI icons
│   ├── products/          # Product images
│   └── ratings/           # Rating stars
├── scripts/               # JavaScript files
│   ├── amazon.js          # Main product page logic
│   ├── checkout.js        # Checkout functionality
│   ├── global.js          # Global utilities
│   └── utils/             # Utility functions
│       ├── money.js       # Currency formatting
│       ├── settings.js    # Global settings manager
│       └── theme.js       # Theme management
├── styles/                # CSS files
│   ├── pages/             # Page-specific styles
│   └── shared/            # Shared styles
├── *.html                 # HTML pages
└── README.md              # This file
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory
   ```bash
   cd backend
   ```

2. Install backend dependencies
   ```bash
   npm install
   ```

3. Start the backend server
   ```bash
   node server.js
   ```
   The backend will run on `http://localhost:3000`

### Frontend Setup

1. Open the project in your browser
   - Navigate to the project root directory
   - Open `index.html` in your browser
   - Or use a local server like Live Server (VS Code extension)

2. Alternative: Use a local server
   ```bash
   # Using Node.js serve (install globally first)
   npm install -g serve
   serve .
   ```

## Usage Guide

### For Users

1. Getting Started
   - Visit the homepage
   - Click "Shop" to browse products
   - Register or login to your account

2. Shopping
   - Browse products with search and filters
   - Add items to cart
   - Proceed to checkout
   - Complete your order

3. Account Management
   - Access settings from the account dropdown
   - Customize theme and preferences
   - View order history and manage returns

### For Developers

1. Adding Products
   - Edit `data/products.js` to add new products
   - Add product images to `images/products/`
   - Update `backend/products.json` for backend data

2. Customizing Styles
   - Modify CSS files in `styles/` directory
   - Use Tailwind CSS classes for styling
   - Update theme variables in `scripts/utils/settings.js`

3. Adding Features
   - Extend functionality in respective JavaScript files
   - Update backend API endpoints in `backend/server.js`
   - Add new HTML pages as needed

## Configuration

### Database Configuration

The project uses JSON files for data storage. For production, consider:
- PostgreSQL for orders and products
- Redis for session management

## Customization

### Themes

The application supports multiple themes:
- Light Theme: Default Amazon-like appearance
- Dark Theme: Dark mode for better eye comfort

### Settings

Global settings include:
- Theme preferences
- Notification preferences
- Privacy settings
- Shipping preferences

## Testing

### Manual Testing

1. User Flow Testing
   - Registration and login
   - Product browsing and search
   - Cart management
   - Checkout process
   - Order tracking

2. Responsive Testing
   - Test on different screen sizes
   - Verify mobile navigation
   - Check touch interactions

3. Browser Testing
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers
   - Different zoom levels

## Contributing

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## Support

If you encounter any issues or have questions:

1. Check the Issues section on GitHub
2. Create a new issue with detailed information
3. Contact the maintainers for urgent matters

## Updates

Stay updated with the latest changes:
- Watch the repository for updates
- Star the project if you find it useful
- Follow for new features and improvements 
