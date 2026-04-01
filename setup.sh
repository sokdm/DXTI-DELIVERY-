#!/bin/bash

echo "🚀 DXTI Delivery Service Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install backend dependencies
echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

# Create .env file if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please update the .env file with your MongoDB Atlas and Cloudinary credentials"
fi

cd ..

# Install frontend dependencies
echo ""
echo "🎨 Installing Frontend Dependencies..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

# Install admin dependencies
echo ""
echo "🛠️  Installing Admin Panel Dependencies..."
cd admin
npm install
echo "✅ Admin panel dependencies installed"

cd ..

echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your credentials"
echo "2. Run: ./start.sh"
echo ""
echo "Default Admin Login:"
echo "   Email: admin@dxti.com"
echo "   Password: admin123"
echo ""
