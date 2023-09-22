import type { Image } from "../../../quarks/image-index";
import { ImageIndex, ImageType } from "../../../quarks/image-index";
import type { UserInfo } from "../../../quarks/users-index";
import { UsersIndex } from "../../../quarks/users-index";
import { RequestError } from "../../../utils/errors/fetch-error";
import type { AsyncResult } from "../../../utils/result";
import { AsyncAll, err, ok } from "../../../utils/result";
import type { SlackService } from "../slack-service";
import type {
  UserProfilePictureBytes,
  UserProfilePictureLink,
} from "../slack-types";

export class SlackServiceUsersModule {
  constructor(private readonly mainService: SlackService) {}

  private get client() {
    return this.mainService.getClient();
  }

  private async requestUserInfo(
    userID: string,
  ): AsyncResult<UserInfo, RequestError> {
    const response = await this.client.users.info({
      user: userID,
    });

    if (!response.ok) {
      return err(new RequestError(response.error, response));
    }

    const user: UserInfo = {
      id: response.user!.id!.toString(),
      name: response.user!.real_name ?? response.user!.name!.toString(),
      email: response.user!.profile?.email ?? "",
      teamID: response.user!.team_id ?? "",
      color: response.user!.color ?? "",
      phone: response.user!.profile?.phone ?? "",
      image: {
        original: response.user!.profile?.image_original,
        px1024: response.user!.profile?.image_1024,
        px512: response.user!.profile?.image_512,
        px192: response.user!.profile?.image_192,
        px72: response.user!.profile?.image_72,
        px48: response.user!.profile?.image_48,
        px32: response.user!.profile?.image_32,
        px24: response.user!.profile?.image_24,
      },
    };

    return ok(user);
  }

  private async requestUserProfilePicture(
    user: UserInfo,
  ): AsyncResult<UserProfilePictureBytes[], Error[]> {
    const pfps: UserProfilePictureLink[] = [];

    if (user.image.px1024) {
      pfps.push({
        link: user.image.px1024,
        size: 1024,
      });
    }
    if (user.image.px512) {
      pfps.push({
        link: user.image.px512,
        size: 512,
      });
    }
    if (user.image.px192) {
      pfps.push({
        link: user.image.px192,
        size: 192,
      });
    }
    if (user.image.px72) {
      pfps.push({
        link: user.image.px72,
        size: 72,
      });
    }
    if (user.image.px48) {
      pfps.push({
        link: user.image.px48,
        size: 48,
      });
    }
    if (user.image.px32) {
      pfps.push({
        link: user.image.px32,
        size: 32,
      });
    }
    if (user.image.px24) {
      pfps.push({
        link: user.image.px24,
        size: 24,
      });
    }

    const buffs: AsyncResult<UserProfilePictureBytes>[] = [];

    for (const pfp of pfps) {
      const pfpBuff = fetch(pfp.link)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => new Uint8Array(arrayBuffer))
        .then((buffer) => ok({ buffer, size: pfp.size }))
        .catch((error) => err(error));

      buffs.push(pfpBuff);
    }

    return await AsyncAll(buffs);
  }

  /**
   * Gets the user of the specified ID from the index, or if not present fetches
   * it and saves to the index.
   */
  async getUser(userID: string): AsyncResult<UserInfo, RequestError> {
    const knownUsers = UsersIndex.get();

    const user = knownUsers.users.find((user) => user.id === userID);

    if (user) {
      return ok(user);
    }

    const result = await this.requestUserInfo(userID);

    if (result.ok) {
      UsersIndex.addUser(result.value);
    }

    return result;
  }

  /**
   * Gets the user profile picture of the specified ID from the index, or if not
   * present fetches it and saves to the index.
   */
  async getUserProfilePicture(
    userID: string,
  ): AsyncResult<Image[], RequestError | Error[]> {
    const pfps = ImageIndex.get().images.filter(
      (image) =>
        image.type === ImageType.ProfilePicture && image.uid === userID,
    );

    if (pfps.length === 0) {
      const result = await this.getUser(userID);

      if (!result.ok) {
        return result;
      }

      const userPfps = await this.requestUserProfilePicture(result.value);

      if (!userPfps.ok) {
        return userPfps;
      }

      await ImageIndex.addProfilePictures(userID, userPfps.value);

      return ok(
        ImageIndex.get().images.filter(
          (image) =>
            image.type === ImageType.ProfilePicture && image.uid === userID,
        ),
      );
    }

    return ok(pfps);
  }
}
