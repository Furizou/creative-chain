import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = 'https://uaykbwwzqywkusmyxrbc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVheWtid3d6cXl3a3VzbXl4cmJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTExNzU3NywiZXhwIjoyMDQ0NjkzNTc3fQ.ZOGLKvAeBh2G1Z8Kt2NKZxqkqTlr34Fk9vr_n8UY9O4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoUser() {
  console.log('👤 Creating demo user in Supabase Auth...');

  try {
    // Create user in auth.users table
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'demo@creativechain.com',
      password: 'Demo123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Creator',
        username: 'democreator'
      }
    });

    if (userError) {
      if (userError.message.includes('already exists')) {
        console.log('✅ Demo user already exists');
        return;
      }
      throw userError;
    }

    console.log('✅ Demo user created successfully:', userData.user.id);
    console.log('📧 Email: demo@creativechain.com');
    console.log('🔑 Password: Demo123!');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  }
}

// Run the function
createDemoUser();