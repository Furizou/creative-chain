import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const testUserData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      fullName: 'Test User',
      username: 'testuser123'
    };

    console.log('🔵 Creating test account with data:', {
      email: testUserData.email,
      fullName: testUserData.fullName,
      username: testUserData.username
    });

    // Call our signup API
    const signupResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUserData),
    });

    const signupData = await signupResponse.json();

    if (!signupResponse.ok) {
      console.error('❌ Test account creation failed:', signupData);
      return NextResponse.json(
        { error: signupData.error, details: signupData.details },
        { status: signupResponse.status }
      );
    }

    console.log('✅ Test account created successfully');
    return NextResponse.json({
      message: 'Test account created successfully',
      user: signupData.user,
      credentials: {
        email: testUserData.email,
        password: testUserData.password
      }
    });

  } catch (error) {
    console.error('❌ Test account creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create test account', details: error.message },
      { status: 500 }
    );
  }
}