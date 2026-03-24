import { Module } from '@nestjs/common';
import { ExercisesModule } from '../exercises/exercises.module';
import { UploadController } from './upload.controller';

@Module({
  imports: [ExercisesModule],
  controllers: [UploadController],
})
export class UploadModule {}
