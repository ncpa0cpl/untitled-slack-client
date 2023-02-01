import envs from "gapp:env";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import path from "path";
import { quark } from "react-quarks";
import { QuarkFileSyncService } from "../services/quark-file-sync-service/quark-file-sync-service";
import { fileExists, writeFile } from "../utils/fs/fs-utils";

enum ImageType {
  ProfilePicture = "profile-picture",
  UserContent = "user-content",
}

type ProfilePicture = {
  type: ImageType.ProfilePicture;
  size: 24 | 32 | 48 | 72 | 192 | 512 | 1024;
  uid: string;
  fileLocation: string;
};

type UserImage = {
  type: ImageType.UserContent;
  contentID: string;
  fileLocation: string;
};

type Image = ProfilePicture | UserImage;

const IMAGES_DIR = path.resolve(
  GLib.get_user_config_dir(),
  envs.appName,
  "images"
);

if (!fileExists(IMAGES_DIR))
  Gio.File.new_for_path(IMAGES_DIR).make_directory_with_parents(null);

export const ImageIndex = quark(
  {
    firsLoadCompleted: false,
    images: [] as Image[],
  },
  {
    actions: {
      async addProfilePicture(
        state,
        uid: string,
        size: ProfilePicture["size"],
        image: Uint8Array
      ) {
        if (
          state.images.some(
            (img) =>
              img.type === ImageType.ProfilePicture &&
              img.uid === uid &&
              img.size === size
          )
        ) {
          return state;
        }

        const filename = `upfp_x${size}_${uid}.png`;
        const fileLocation = path.resolve(IMAGES_DIR, filename);

        await writeFile(fileLocation, image);

        return {
          ...state,
          images: state.images.concat([
            {
              type: ImageType.ProfilePicture,
              fileLocation,
              uid,
              size,
            },
          ]),
        };
      },
      async addUserImage(state, contentID: string, image: Uint8Array) {
        const filename = `uc_image_${contentID}.png`;
        const fileLocation = path.resolve(IMAGES_DIR, filename);

        await writeFile(fileLocation, image);

        return {
          ...state,
          images: state.images.concat([
            {
              type: ImageType.UserContent,
              fileLocation,
              contentID,
            },
          ]),
        };
      },
    },
    selectors: {
      useProfilePicture(state, uid?: string, size?: ProfilePicture["size"]) {
        if (!uid) return undefined;

        if (size != null) {
          return state.images.find(
            (image) =>
              image.type === ImageType.ProfilePicture &&
              image.uid === uid &&
              image.size === size
          );
        }

        return state.images.find(
          (image) =>
            image.type === ImageType.ProfilePicture && image.uid === uid
        );
      },
      useUserImage(state, contentID: string) {
        return state.images.find(
          (image) =>
            image.type === ImageType.UserContent &&
            image.contentID === contentID
        );
      },
    },
  }
);

QuarkFileSyncService.registerQuark("image-index", ImageIndex);
