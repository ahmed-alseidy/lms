import {
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
    expiresIn: number = 60 * 60 * 1000
  ) {
    const isSegment = key.endsWith(".ts");
    const actualContentType = isSegment ? "video/mp2t" : contentType;

    return createPresignedPost(this.s3Client, {
      Bucket: this._s3Config.bucket!,
      Key: key,
      Fields: {
        key,
        "Content-Type": actualContentType,
      },
      Conditions: [
        ["eq", "$Content-Type", actualContentType],
        ["content-length-range", 0, 500 * 1024 * 1024], // 500MB max
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
}
