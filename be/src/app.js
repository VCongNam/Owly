import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Owly Backend is running' });
});

// Supabase Connection Check route
app.get('/supabase-check', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    
    const hasCredentials = supabaseUrl && supabaseKey &&
      supabaseUrl !== 'your_supabase_url' &&
      supabaseKey !== 'your_supabase_service_role_key';

    // We can run a quick check using the supabase client itself
    let connectionError = null;
    let authCheck = null;
    
    if (hasCredentials) {
      // Test the connection by getting the session (local check)
      const { data, error } = await supabase.auth.getSession();
      authCheck = data;
      if (error) connectionError = error.message;
    }

    res.json({
      configured: !!hasCredentials,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
      connectionError,
      message: hasCredentials 
        ? 'Supabase client is configured and initialized.' 
        : 'Supabase is not configured yet. Please update the .env file.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint for Production / Dev environment verification
app.get('/health', async (req, res) => {
  res.json({
    status: 'UP',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
