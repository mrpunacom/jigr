import { NextResponse } from 'next/server';
import { getAuthenticatedClientId } from '@/lib/api-utils';
import { getAuthUrl } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const { user_id } = await getAuthenticatedClientId();
    const { searchParams } = new URL(request.url);
    
    // Get module and redirect parameters
    const module = searchParams.get('module') || 'stock';
    const redirectTo = searchParams.get('redirect_to') || `/${module}/import`;
    
    // Generate OAuth URL
    const authUrl = getAuthUrl(user_id);
    
    // Create response with redirect
    const response = NextResponse.redirect(authUrl);
    
    // Set secure cookies to track OAuth state for callback
    response.cookies.set('oauth_redirect_to', redirectTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    });
    
    response.cookies.set('oauth_module', module, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    });
    
    console.log(`🚀 Initiating Google OAuth for user ${user_id}, module: ${module}`);
    
    return response;
    
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    
    // Get module for error redirect
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module') || 'stock';
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${module}/import?error=oauth_failed`
    );
  }
}