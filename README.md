# Autoweave Notes - AI-Powered Note-Taking Application

Autoweave Notes is a modern, AI-enhanced note-taking application built with React, TypeScript, and Supabase. It combines the power of traditional note-taking with advanced AI features to help you organize and analyze your thoughts more effectively.

## Features

### Core Note-Taking

- 📝 Rich Markdown editing with live preview
- 📁 Folder organization for notes
- 🏷️ Tag support for better organization
- 🔗 Wiki-style linking between notes
- 📊 Visual graph view of note connections
- 🌓 Multiple theme options (Light, Dark, Dim, Nord, Sunset)
- 📱 Responsive design for all devices

### AI-Powered Features

- 🤖 AI Assistant Sage (RAG) for summarizing and
- 🔍 Semantic search using OpenAI embeddings
- ✨ AI-powered note cleanup and formatting
- 🔗 Intelligent note linking suggestions

### Collaboration & Sharing

- 🌐 Public note sharing via unique links
- 🔒 Secure authentication system
- 👥 Multi-user support
- 🔐 Row-level security for data protection


### Screenshots

<img width="1512" alt="Screenshot 2025-03-28 at 1 49 12 PM" src="https://github.com/user-attachments/assets/c32682f2-5846-44b8-9690-0ae3e78e5bea" />

<img width="1512" alt="Screenshot 2025-03-28 at 1 49 22 PM" src="https://github.com/user-attachments/assets/5bb7c915-d4dc-4d5a-ba81-0ec0ca0fd850" />

<img width="1511" alt="Screenshot 2025-03-28 at 1 49 32 PM" src="https://github.com/user-attachments/assets/4badcee4-643c-4abe-8260-f2cfa6658ec7" />

<img width="1512" alt="Screenshot 2025-03-28 at 1 49 41 PM" src="https://github.com/user-attachments/assets/954d4c3a-34a4-4da2-b0ea-9aa71454604d" />

<img width="1512" alt="Screenshot 2025-03-28 at 1 49 57 PM" src="https://github.com/user-attachments/assets/73e8be1c-975e-4927-a6d0-6e1cfa4d7b77" />


## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/amalrajiv/autoweavenotes.git
cd autoweavenotes
```

2. Install dependencies:

```bash
npm install
```

3. Create a Supabase project:

   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Note down the project URL and anon key

4. Set up environment variables:

```bash
cp .env.example .env
```

Update the following in your `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Set up the database schema:

   - Navigate to the SQL editor in your Supabase dashboard
   - Execute all migration files from the `supabase/migrations` folder in order
   - The migrations will create all necessary tables, functions, and policies

6. Start the development server:

```bash
npm run dev
```

### Supabase Setup

1. **Authentication Setup**:

   - Go to Authentication > Providers
   - Enable Email auth
   - (Optional) Configure additional providers (GitHub, Google, etc.)

2. **Storage Setup**:

   - Storage bucket for attachments is created automatically via migrations
   - Verify the `note-attachments` bucket exists
   - Check storage policies are correctly applied

3. **Real-time Setup**:

   - Go to Database > Replication
   - Enable real-time for:
     - notes
     - folders
     - backlinks
     - tags

4. **Database Indexes**:
   - Vector similarity search index is created via migrations
   - Verify indexes are created for optimal performance

### Deployment

1. **Build the application**:

```bash
npm run build
```

2. **Deploy to Netlify**:

   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Custom Domain Setup**:
   - Add your custom domain in Netlify settings
   - Update DNS records as per Netlify instructions
   - Enable HTTPS

### Production Considerations

1. **API Keys**:

   - Never expose service role key
   - Users provide their own OpenAI API keys via settings
   - Use environment variables for sensitive data

2. **Security**:

   - RLS policies are automatically set up via migrations
   - Review and test all security policies
   - Enable MFA for admin accounts

3. **Monitoring**:

   - Set up error tracking (e.g., Sentry)
   - Monitor database performance
   - Set up alerts for critical errors

4. **Backup**:
   - Enable point-in-time recovery in Supabase
   - Set up regular backups
   - Document recovery procedures

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Supabase](https://supabase.com)
- AI features by [OpenAI](https://openai.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
