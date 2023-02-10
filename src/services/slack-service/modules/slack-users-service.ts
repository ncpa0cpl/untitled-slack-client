import type { ProfilePicture } from "../../../quarks/image-index";
import { ImageIndex, ImageType } from "../../../quarks/image-index";
import type { UserInfo } from "../../../quarks/users-index";
import { UsersIndex } from "../../../quarks/users-index";
import type { SlackService } from "../slack-service";

export class SlackUsersService {
  constructor(private readonly mainService: typeof SlackService) {}

  private async fetchUser(userID: string) {
    const client = this.mainService.getClient();

    const response = await client.users.info({
      user: userID,
    });

    if (!response.ok) {
      throw new Error(response.error);
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

    return user;
  }

  private async fetchUsersProfilePictures(user: UserInfo) {
    const pfps: {
      link: string;
      size: ProfilePicture["size"];
    }[] = [];

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

    const buffs: Promise<{
      buffer: Uint8Array;
      size: ProfilePicture["size"];
    }>[] = [];

    for (const pfp of pfps) {
      const pfpBuff = fetch(pfp.link)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => new Uint8Array(arrayBuffer))
        .then((buffer) => ({ buffer, size: pfp.size }));

      buffs.push(pfpBuff);
    }

    return await Promise.all(buffs);
  }

  /**
   * Gets the user of the specified ID from the index, or if not
   * present fetches it and saves to the index.
   */
  async getUser(userID: string) {
    const knownUsers = UsersIndex.get();

    let user = knownUsers.users.find((user) => user.id === userID);

    if (!user) {
      user = await this.fetchUser(userID);
      UsersIndex.addUser(user);
    }

    return user;
  }

  /**
   * Gets the user profile picture of the specified ID from the
   * index, or if not present fetches it and saves to the index.
   */
  async getUserProfilePictures(userID: string) {
    const pfps = ImageIndex.get().images.filter(
      (image) => image.type === ImageType.ProfilePicture && image.uid === userID
    );

    if (pfps.length === 0) {
      const user = await this.getUser(userID);
      const userPfps = await this.fetchUsersProfilePictures(user);
      await ImageIndex.addProfilePictures(userID, userPfps);

      return ImageIndex.get().images.filter(
        (image) =>
          image.type === ImageType.ProfilePicture && image.uid === userID
      );
    }

    return pfps;
  }
}
