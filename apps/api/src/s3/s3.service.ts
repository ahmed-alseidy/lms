import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import s3Config from "./config/s3.config";

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  constructor(
    @Inject(s3Config.KEY) private _s3Config: ConfigType<typeof s3Config>,
  ) {
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: this._s3Config.endpoint!,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this._s3Config.accessKeyId!,
        secretAccessKey: this._s3Config.secretAccessKey!,
      },
    });
  }

  async deleteDirectory(prefix: string) {
    const listCommand = new ListObjectsV2Command({
      Bucket: this._s3Config.bucket!,
      Prefix: prefix,
    });

    const listedObjects = await this.s3Client.send(listCommand);

    if (listedObjects.Contents?.length) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this._s3Config.bucket!,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
        },
      });

      await this.s3Client.send(deleteCommand);
    }
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 60 * 60 * 1000,
    allowedFileTypes?: string[],
    maxFileSize?: number
  ) {
    const isSegment = key.endsWith(".ts");
    const actualContentType = isSegment ? "video/mp2t" : contentType;

    // Validate file type if allowedFileTypes is provided
    if (allowedFileTypes && allowedFileTypes.length > 0) {
      const isValidType = allowedFileTypes.some(
        (type) =>
          contentType === type ||
          contentType.startsWith(type + "/") ||
          contentType.match(new RegExp(`^${type.replace("*", ".*")}$`))
      );

      if (!isValidType) {
        throw new Error(
          `File type ${contentType} is not allowed. Allowed types: ${allowedFileTypes.join(", ")}`
        );
      }
    }

    const maxSize = maxFileSize || 500 * 1024 * 1024; // Default 500MB

    return createPresignedPost(this.s3Client, {
      Bucket: this._s3Config.bucket!,
      Key: key,
      Fields: {
        key,
        "Content-Type": actualContentType,
      },
      Conditions: [
        ["eq", "$Content-Type", actualContentType],
        ["content-length-range", 0, maxSize],
      ],
      Expires: expiresIn,
    });
  }

  async getSignedUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: this._s3Config.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // Helper method for resource uploads with file type validation
  async generateResourceUploadUrl(
    key: string,
    contentType: string,
    allowedFileTypes: string[] = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      "image/*",
    ],
    maxFileSize: number = 50 * 1024 * 1024, // Default 50MB for resources
    expiresIn: number = 60 * 60 * 1000
  ) {
    return this.generateUploadUrl(
      key,
      contentType,
      expiresIn,
      allowedFileTypes,
      maxFileSize
    );
  }

  async deleteFile(key: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this._s3Config.bucket!,
      Key: key,
    });
    await this.s3Client.send(deleteCommand);
  }
}
