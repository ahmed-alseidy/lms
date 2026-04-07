import { CreateMuxVideoDto, db, videos } from "@lms-saas/shared-lib";
import { Mux } from "@mux/mux-node";
import { HeadersLike } from "@mux/mux-node/core";
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { eq } from "drizzle-orm";
import { attempt } from "@/utils/error-handling";
import muxConfig from "./config/mux.config";

@Injectable()
export class MuxService {
  private readonly mux: Mux;

  constructor(
    @Inject(muxConfig.KEY) private _muxConfig: ConfigType<typeof muxConfig>,
  ) {
    this.mux = new Mux({
      tokenId: this._muxConfig.tokenId,
      tokenSecret: this._muxConfig.tokenSecret,
    });
  }

  async createDirectUpload(lessonId: number, { title }: CreateMuxVideoDto) {
    const [videoUpload, videoUploadError] = await attempt(
      this.mux.video.uploads.create({
        cors_origin: "*",
        new_asset_settings: {
          playback_policy: ["public"],
          video_quality: "basic",
        },
      })
    );

    if (videoUploadError) {
      throw new InternalServerErrorException(videoUploadError.message);
    }

    const [video, videoError] = await attempt(
      db
        .insert(videos)
        .values({
          title,
          videoType: "mux",
          muxAssetId: videoUpload.asset_id,
          muxStatus: "waiting",
          lessonId,
        })
        .returning({
          id: videos.id,
        })
    );

    if (videoError) {
      throw new InternalServerErrorException("Cannot create video");
    }

    return { uploadUrl: videoUpload.url, videoId: video[0].id };
  }

  async handleWebHook(rawBody: string, muxSignature: HeadersLike) {
    const event = this.mux.webhooks.unwrap(
      rawBody,
      muxSignature,
      this._muxConfig.webhookSecret
    );

    if (event.type === "video.asset.ready") {
      const { id: assetId } = event.data;

      const [, videoError] = await attempt(
        db
          .update(videos)
          .set({
            muxStatus: "ready",
            muxPlaybackId: event.data.playback_ids?.[0]?.id,
          })
          .where(eq(videos.muxAssetId, assetId))
      );
      if (videoError) {
        throw new InternalServerErrorException("Cannot update video");
      }
    } else if (event.type === "video.asset.errored") {
      const { id: assetId } = event.data;

      const [, videoError] = await attempt(
        db
          .update(videos)
          .set({ muxStatus: "errored" })
          .where(eq(videos.muxAssetId, assetId))
      );
      if (videoError) {
        throw new InternalServerErrorException("Cannot update video");
      }
    }
  }

  async getAssetStatus(muxAssetId: string) {
    const [asset, error] = await attempt(
      this.mux.video.assets.retrieve(muxAssetId)
    );
    if (error || !asset) {
      return { status: "errored" as const, playbackId: null };
    }
    return {
      status: asset.status as string,
      playbackId: asset.playback_ids?.[0]?.id ?? null,
    };
  }

  async markAsReady(muxAssetId: string, playbackId: string) {
    await attempt(
      db
        .update(videos)
        .set({ muxStatus: "ready", muxPlaybackId: playbackId })
        .where(eq(videos.muxAssetId, muxAssetId))
    );
  }

  async deleteAsset(assetId: string) {
    const [, assetError] = await attempt(this.mux.video.assets.delete(assetId));
    if (assetError) {
      throw new InternalServerErrorException("Cannot delete asset");
    }

    const [, videoError] = await attempt(
      db.delete(videos).where(eq(videos.muxAssetId, assetId))
    );
    if (videoError) {
      throw new InternalServerErrorException("Cannot delete video");
    }

    return { success: true };
  }
}
