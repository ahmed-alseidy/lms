import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "@/users/users.module";
import muxConfig from "./config/mux.config";
import { MuxController } from "./mux.controller";
import { MuxService } from "./mux.service";

@Module({
  imports: [ConfigModule.forFeature(muxConfig), UsersModule],
  controllers: [MuxController],
  providers: [MuxService],
  exports: [MuxService],
})
export class MuxModule {}
