import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    if (serviceAccountPath && !admin.apps.length) {
      try {
        const path = require('path');
        const fs = require('fs');
        const fullPath = path.resolve(process.cwd(), serviceAccountPath);
        
        if (fs.existsSync(fullPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            });
            this.logger.log('Firebase Admin initialized successfully');
        } else {
            this.logger.warn(`Firebase service account file not found at ${fullPath}. Firebase auth will fail.`);
        }
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin', error);
      }
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.error('Error verifying Firebase ID token', error);
      throw new Error('Invalid Firebase token');
    }
  }
}
