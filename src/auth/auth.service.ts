import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  GoogleUserDto,
  AuthResponseDto,
  JwtPayload,
} from './dto/google-auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async googleLogin(googleUser: GoogleUserDto): Promise<AuthResponseDto> {
    const { email, fullName, picture, googleId } = googleUser;
    console.log('Creating/Updating user with data:', { email, fullName, googleId });

    // Cari atau buat user
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Buat user baru jika belum ada
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: fullName,
          googleId,
          profilePicture: picture,
          provider: 'google',
          isVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    } else {
      // Update googleId jika user sudah ada tapi belum punya googleId
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            isVerified: true,
            emailVerifiedAt: user.emailVerifiedAt || new Date(),
          },
        });
      }
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        isSeller: user.isSeller,
        isVerified: user.isVerified,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId, status: 'active' },
    });
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        nim: true,
        major: true,
        batch: true,
        phoneNumber: true,
        profilePicture: true,
        bio: true,
        isSeller: true,
        avgRating: true,
        totalReviews: true,
        totalOrdersCompleted: true,
        status: true,
        isVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Extract NIM from email if not set
    if (!user.nim && user.email.endsWith('@students.uin-suska.ac.id')) {
      user.nim = user.email.split('@')[0];
    }

    return user;
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if NIM is unique if being updated
    if (updateData.nim && updateData.nim !== existingUser.nim) {
      const nimExists = await this.prisma.user.findUnique({
        where: { nim: updateData.nim },
      });
      if (nimExists) {
        throw new Error('NIM already exists');
      }
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        nim: true,
        major: true,
        batch: true,
        phoneNumber: true,
        profilePicture: true,
        bio: true,
        isSeller: true,
        avgRating: true,
        totalReviews: true,
        totalOrdersCompleted: true,
        status: true,
        isVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
