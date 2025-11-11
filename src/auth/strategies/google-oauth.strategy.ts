// src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('=== DEBUG: Google Profile ===');
    console.log('Display Name:', profile.displayName);
    console.log('Name Object:', profile.name);
    console.log('Emails:', profile.emails);
    console.log('Raw Profile:', JSON.stringify(profile, null, 2));
    console.log('===========================');
    console.log('Raw Google profile:', JSON.stringify(profile, null, 2));
    
    const { id, displayName, emails, photos } = profile;
    
    // Extract email or throw error if not available
    const email = emails?.[0]?.value;
    if (!email) {
      throw new Error('No email found in Google profile');
    }
    
    // Use displayName or fallback to email username
    let fullName = displayName || email.split('@')[0];
    console.log('Using fullName:', fullName);
    
    const user = {
      googleId: id,
      email: email,
      fullName: fullName,
      profilePicture: photos?.[0]?.value,
      provider: 'google',
    };
    
    console.log('Processed user data:', user);

    done(null, user);
  }
}