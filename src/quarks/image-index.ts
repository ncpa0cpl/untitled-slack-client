import Fs from "fs-gjs";
import envs from "gapp:env";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import path from "path";
import { quark } from "react-quarks";
import { QuarkFileSyncService } from "../services/quark-file-sync-service/quark-file-sync-service";
import type { UserProfilePictureBytes } from "../services/slack-service/slack-types";

export enum ImageType {
  ProfilePicture = "profile-picture",
  UserContent = "user-content",
  Attachment = "attachment",
}

export type ProfilePicture = {
  type: ImageType.ProfilePicture;
  size: 24 | 32 | 48 | 72 | 192 | 512 | 1024;
  uid: string;
  fileLocation: string;
};

export type UserImage = {
  type: ImageType.UserContent;
  contentID: string;
  fileLocation: string;
};

export type AttachmentImage = {
  type: ImageType.Attachment;
  contentID: string;
  fileLocation: string;
};

export type Image = ProfilePicture | UserImage | AttachmentImage;

const IMAGES_DIR = path.resolve(
  GLib.get_user_config_dir(),
  envs.appName,
  "images"
);

if (!Fs.sync.fileExists(IMAGES_DIR))
  Gio.File.new_for_path(IMAGES_DIR).make_directory_with_parents(null);

export const ImageIndex = quark(
  {
    firsLoadCompleted: false,
    images: [] as Image[],
  },
  {
    actions: {
      async addProfilePictures(
        state,
        uid: string,
        images: UserProfilePictureBytes[]
      ) {
        const newImages: Image[] = [];

        for (const image of images) {
          if (
            state.images.some(
              (img) =>
                img.type === ImageType.ProfilePicture &&
                img.uid === uid &&
                img.size === image.size
            )
          ) {
            continue;
          }

          const filename = `upfp_${uid}_x${image.size}.png`;
          const fileLocation = path.resolve(IMAGES_DIR, filename);

          await Fs.writeFile(fileLocation, image.buffer);

          newImages.push({
            uid,
            fileLocation,
            size: image.size,
            type: ImageType.ProfilePicture,
          });
        }

        return {
          ...state,
          images: state.images.concat(newImages),
        };
      },
      async addUserImage(state, contentID: string, image: Uint8Array) {
        const filename = `uc_image_${contentID}.png`;
        const fileLocation = path.resolve(IMAGES_DIR, filename);

        await Fs.writeFile(fileLocation, image);

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
      async addAttachmentImage(state, contentID: string, image: Uint8Array) {
        const filename = `attachment_image_${contentID}.png`;
        const fileLocation = path.resolve(IMAGES_DIR, filename);

        await Fs.writeFile(fileLocation, image);

        return {
          ...state,
          images: state.images.concat([
            {
              type: ImageType.Attachment,
              fileLocation,
              contentID,
            },
          ]),
        };
      },
    },
    selectors: {
      profilePicture(state, uid?: string, size?: ProfilePicture["size"]) {
        if (!uid) return undefined;

        if (size != null) {
          return state.images.reduce(
            (foundImg: ProfilePicture | undefined, nextImg) => {
              if (
                nextImg.type === ImageType.ProfilePicture &&
                nextImg.uid === uid
              ) {
                if (!foundImg) return nextImg;
                if (foundImg.size === size) return foundImg;
                if (nextImg.size === size) return nextImg;

                const foundSizeDelta = Math.abs(foundImg.size - size);
                const nextSizeDelta = Math.abs(nextImg.size - size);

                if (nextSizeDelta < foundSizeDelta) return nextImg;
              }
              return foundImg;
            },
            undefined
          );
        }

        return state.images.find(
          (image) =>
            image.type === ImageType.ProfilePicture && image.uid === uid
        );
      },
      userImage(state, contentID: string) {
        return state.images.find(
          (image) =>
            image.type === ImageType.UserContent &&
            image.contentID === contentID
        );
      },
      attachmentImage(state, contentID?: string) {
        return state.images.find(
          (image) =>
            image.type === ImageType.Attachment && image.contentID === contentID
        );
      },
    },
  }
);

QuarkFileSyncService.registerQuark("image-index", ImageIndex);
