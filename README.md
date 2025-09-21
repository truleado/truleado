# Truleado - Reddit Lead Discovery SaaS

Find your next customers on Reddit with AI-powered lead discovery. Stop cold emailing strangers and start connecting with people who are actively discussing problems your SaaS product solves.

## 🚀 Features

- **Reddit-First Lead Generation**: Monitor relevant subreddits for SaaS opportunities
- **AI-Powered Analysis**: Use OpenAI to analyze posts and comments for lead potential
- **Real Conversation Context**: Get the exact Reddit post that proves they're interested
- **Continuous Monitoring**: Background jobs that run 24/7 to find new leads
- **Product Management**: Define your SaaS product and get relevant subreddit suggestions
- **Lead Storage**: Persistent storage with deduplication and lead management
- **Modern UI**: Beautiful, responsive interface built with Next.js 15 and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time)
- **Payments**: Paddle
- **APIs**: Reddit API, OpenAI API, Google API
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+
- Supabase account
- Paddle account
- Reddit API credentials
- OpenAI API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/truleado/truleado.git
cd truleado
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Paddle Configuration
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token
NEXT_PUBLIC_PADDLE_PRICE_ID=your_paddle_price_id
PADDLE_API_KEY=your_paddle_api_key
PADDLE_PRICE_ID=your_paddle_price_id
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret

# Reddit API Configuration
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=Truleado/1.0 by your_username

# Google API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Set Up Supabase

1. Create a new Supabase project
2. Run the database migrations (create tables for users, products, leads, etc.)
3. Enable Row Level Security (RLS)
4. Set up authentication providers

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 API Setup

### Reddit API Setup

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Click "Create App"
3. Fill in:
   - **Name**: Truleado Lead Generator
   - **App Type**: "script"
   - **Description**: Lead generation tool
   - **Redirect URI**: `http://localhost:3000` (dev) / `https://your-domain.com` (prod)

### OpenAI API Setup

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to environment variables

### Paddle Setup

1. Create a Paddle account
2. Get your client token and API key
3. Configure webhooks for subscription events

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Main dashboard
│   ├── leads/              # Lead management
│   ├── products/           # Product management
│   └── settings/           # User settings
├── components/             # Reusable components
├── contexts/               # React contexts
└── lib/                    # Utility libraries
```

## 🔄 How It Works

1. **Define Your Product**: Add your SaaS product details and target subreddits
2. **AI Analysis**: Our AI scans Reddit posts and comments for relevant discussions
3. **Lead Generation**: Find people actively seeking solutions your product provides
4. **Context & Contact**: Get the original Reddit post plus contact details
5. **Continuous Monitoring**: Background jobs run hourly to find new opportunities

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service
- **Paddle** - Payment processing
- **Lucide React** - Beautiful icons

## 📊 Database Schema

The application uses Supabase with the following main tables:

- `users` - User profiles and authentication
- `products` - SaaS products to monitor
- `leads` - Discovered Reddit leads
- `subreddits` - Monitored subreddits
- `subscriptions` - User subscription data

## 🔒 Security

- Environment variables for API keys
- Row Level Security (RLS) in Supabase
- Input validation and sanitization
- Secure authentication with Supabase Auth

## 📈 Scaling Considerations

- **Reddit API**: Consider premium tier for production (60 req/min → unlimited)
- **OpenAI Costs**: Monitor usage and set billing limits
- **Database**: Supabase handles scaling automatically
- **Authentication**: Supabase Auth with social providers
- **Monitoring**: Add error tracking and analytics

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect GitHub repository** to Vercel
2. **Add Environment Variables** in Vercel dashboard
3. **Deploy!**

### Deploy to Netlify

1. **Connect GitHub repository**
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Add environment variables**
4. **Deploy**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for SaaS founders who want to find customers through Reddit conversations.**