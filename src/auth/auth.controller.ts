import { Controller, Get, Put, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const googleUser = req.user as any;
      console.log('=== DEBUG: Google User in Controller ===');
      console.log('User Object:', JSON.stringify(googleUser, null, 2));
      console.log('======================================');

      // Ensure we have required fields
      if (!googleUser?.email || !googleUser?.googleId) {
        console.error('Missing required user information from Google:', googleUser);
        throw new Error('Missing required user information from Google');
      }

      // Get the full name from the user object
      const fullName = googleUser.fullName || 
                      googleUser.displayName || 
                      googleUser.email.split('@')[0];

      console.log('Final user data being sent to service:', {
        email: googleUser.email,
        fullName,
        picture: googleUser.profilePicture || googleUser.picture,
        googleId: googleUser.googleId
      });

      const result = await this.authService.googleLogin({
        email: googleUser.email,
        fullName: fullName,
        picture: googleUser.profilePicture || googleUser.picture,
        googleId: googleUser.googleId,
      });

      // Redirect ke frontend dengan token
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      
      // Pastikan URL frontend tidak diakhiri dengan /
      const cleanFrontendUrl = frontendUrl.endsWith('/') 
        ? frontendUrl.slice(0, -1) 
        : frontendUrl;
      
      const redirectUrl = `${cleanFrontendUrl}/auth/callback?token=${result.access_token}`;
      
      console.log('Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      return res.redirect(`${frontendUrl}/auth/error?message=${error.message}`);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: any) {
    // user here is the full user object from JWT strategy, not the payload
    const userData = await this.authService.getUserProfile(user.id);
    return {
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: userData,
    };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @GetUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      // user here is the full user object from JWT strategy, not the payload
      const updatedUser = await this.authService.updateProfile(
        user.id,
        updateProfileDto,
      );
      return {
        statusCode: 200,
        message: 'Profile updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message || 'Failed to update profile',
        data: null,
      };
    }
  }

  @Public()
  @Get('health')
  healthCheck() {
    return {
      statusCode: 200,
      message: 'Auth service is running',
    };
  }
}
