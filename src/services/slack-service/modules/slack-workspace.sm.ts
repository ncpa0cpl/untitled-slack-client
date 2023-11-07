import { Queue } from "async-await-queue";
import Fs from "fs-gjs";
import envs from "gapp:env";
import GLib from "gi://GLib";
import path from "path";
import { EmojiIndex } from "../../../quarks/emoji-index";
import { Logger } from "../../../utils/logger";
import { err, ok, type AsyncResult } from "../../../utils/result";
import type { SlackGatewayService } from "../slack-service";

const EMOJI_DIR = path.resolve(
  GLib.get_user_config_dir(),
  envs.appName,
  "emojis",
);

Fs.makeDir(EMOJI_DIR).catch(() => {
  // swallow
});

const KNOWN_IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];

function extractExt(url: string) {
  const parts = url.split(".");

  if (parts.length === 0) {
    return;
  }

  const last = parts.pop();

  if (last && KNOWN_IMAGE_EXTS.includes(last)) {
    return last;
  }

  return "";
}

export class SlackGatewayServiceWorkspaceModule {
  constructor(private readonly mainService: SlackGatewayService) {}

  private get client() {
    return this.mainService.getClient();
  }

  private get axios() {
    return this.mainService.getAxios();
  }

  public async getAllEmoji(): AsyncResult<void, Error | Error[]> {
    const list = await this.client.emoji.list();

    if (!list.ok) {
      return err(new Error(list.error));
    }

    const emojis = Object.entries(list.emoji ?? {});

    const knownEmojis = EmojiIndex.selectAllFromWorkspace(
      this.mainService.workspaceID,
    ).map((e) => e.emojiID);

    const downloadQueue = new Queue(4, 50);
    const ops: Array<Promise<[string, string] | Error>> = [];

    if (emojis.length > 0) Logger.info("Retrieving emojis.");

    for (let i = 0; i < emojis.length; i++) {
      const [name, reference] = emojis[i]!;

      if (knownEmojis.includes(name)) {
        continue;
      }

      if (reference.startsWith("http")) {
        const ext = extractExt(reference);
        const fileLocation = path.join(EMOJI_DIR, `${name}.${ext}`);

        ops.push(
          downloadQueue.run(() =>
            this.axios
              .get<Uint8Array>(reference, {
                responseType: "arraybuffer",
                data: {},
              })
              .then((response) => {
                return Fs.writeFile(fileLocation, response.data);
              })
              .then((): [string, string] => {
                return [name, fileLocation];
              })
              .catch((err) => err as Error),
          ),
        );
      } else if (reference.startsWith("alias:")) {
        const aliasName = reference.slice("alias:".length);
        const referenced = emojis.find(([n]) => n === aliasName);

        if (referenced) {
          const referencedUrl = referenced[1];

          if (!referencedUrl.startsWith("http")) {
            const ext = extractExt(referencedUrl);
            const fileLocation = path.join(EMOJI_DIR, `${name}.${ext}`);

            ops.push(
              this.axios
                .get<Uint8Array>(referencedUrl, { responseType: "arraybuffer" })
                .then((response) => {
                  return Fs.writeFile(fileLocation, response.data);
                })
                .then((): [string, string] => {
                  return [name, fileLocation];
                })
                .catch((err) => err as Error),
            );
          }
        }
      }
    }

    const results = await Promise.all(ops);

    if (results.length > 0) Logger.info("Adding retrieved emojis to index.");

    const emojisToAdd = results
      .filter((r): r is [string, string] => {
        return Array.isArray(r);
      })
      .map(([name, fileLocation]) => {
        return {
          emojiID: name,
          fileLocation,
        };
      });

    EmojiIndex.addEmojis(this.mainService.workspaceID, emojisToAdd);

    const errors = results.filter((r): r is Error => {
      return !Array.isArray(r);
    });

    if (errors.length > 0) {
      Logger.error(errors);
      return err(errors);
    }

    return ok();
  }
}
