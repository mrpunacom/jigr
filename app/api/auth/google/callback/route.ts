import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokensFromCode, saveOAuthTokens } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user_id from initiation
    const error = searchParams.get('error');
    
    // Get cookies set during initiation
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('=', 2))
    );
    const redirectTo = cookies.oauth_redirect_to || '/stock/import';
    const module = cookies.oauth_module || 'stock';
    
    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}?error=access_denied`
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}?error=invalid_callback`
      );
    }
    
    // Exchange authorization code for tokens using our utility
    const tokens = await getTokensFromCode(code);
    
    // Validate we got a refresh token
    if (!tokens.refresh_token) {
      console.error('No refresh token received - user may have already connected');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}?error=no_refresh_token`
      );
    }
    
    // Store tokens in database using our utility
    await saveOAuthTokens(
      state, // user_id
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date
    );
    
    // Success! Redirect based on module
    let successRedirect;
    switch (module) {
      case 'menu':
        successRedirect = `${process.env.NEXT_PUBLIC_APP_URL}/menu/import/google?success=true`;
        break;
      case 'recipes':
        successRedirect = `${process.env.NEXT_PUBLIC_APP_URL}/recipes/import?success=true`;
        break;
      case 'stock':
      default:
        successRedirect = `${process.env.NEXT_PUBLIC_APP_URL}/stock/import/google/select-sheet?success=true`;
        break;
    }
    
    const response = NextResponse.redirect(successRedirect);
    
    // Clear OAuth state cookies
    response.cookies.delete('oauth_redirect_to');
    response.cookies.delete('oauth_module');
    
    console.log(`✅ Google OAuth completed for user ${state}, module: ${module}`);
    
    return response;
    
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    
    // Get fallback redirect from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('=', 2))
    );
    const redirectTo = cookies.oauth_redirect_to || '/stock/import';
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${redirectTo}?error=token_exchange_failed`
    );
  }
}