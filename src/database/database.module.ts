import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('mongodbUri')?.trim();
        if (!uri) {
          throw new Error(
            'MONGODB_URI no está configurada. Añádela en Vercel → Environment Variables.',
          );
        }

        return {
          uri,
          serverSelectionTimeoutMS: 8000,
          maxPoolSize: 5,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
