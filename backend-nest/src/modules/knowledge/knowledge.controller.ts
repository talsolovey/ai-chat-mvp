import { extname } from 'node:path';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { PublicUser } from '../users/user.entity';
import type { KnowledgeDocument } from './knowledge.entity';
import { KnowledgeService } from './knowledge.service';
import {
  MAXIMUM_UPLOAD_SIZE_BYTES,
  SUPPORTED_UPLOAD_EXTENSIONS,
} from './rag.constants';

@Controller('knowledge/documents')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAXIMUM_UPLOAD_SIZE_BYTES },
    }),
  )
  uploadDocument(
    @CurrentUser() authenticatedUser: PublicUser,
    @UploadedFile() uploadedFile: Express.Multer.File | undefined,
  ): Promise<KnowledgeDocument> {
    if (!uploadedFile) {
      throw new BadRequestException('A file is required');
    }

    const fileExtension = extname(uploadedFile.originalname).toLowerCase();
    if (!SUPPORTED_UPLOAD_EXTENSIONS.includes(fileExtension)) {
      throw new BadRequestException(
        `Unsupported file type "${fileExtension}". Supported: ${SUPPORTED_UPLOAD_EXTENSIONS.join(', ')}`,
      );
    }

    const documentContent = uploadedFile.buffer.toString('utf-8');
    if (!documentContent.trim()) {
      throw new BadRequestException('The file is empty');
    }

    return this.knowledgeService.ingestDocument(
      authenticatedUser.id,
      uploadedFile.originalname,
      documentContent,
    );
  }

  @Get()
  listDocuments(
    @CurrentUser() authenticatedUser: PublicUser,
  ): Promise<KnowledgeDocument[]> {
    return this.knowledgeService.listDocuments(authenticatedUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(
    @CurrentUser() authenticatedUser: PublicUser,
    @Param('id') documentId: string,
  ): Promise<void> {
    await this.knowledgeService.deleteDocument(
      authenticatedUser.id,
      documentId,
    );
  }
}
