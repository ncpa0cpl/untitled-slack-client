import React from "react";
import type { Align } from "react-gjs-renderer";
import { Box, Image } from "react-gjs-renderer";
import type { MarginProps } from "react-gjs-renderer/dist/gjs-elements/utils/property-maps-factories/create-margin-prop-mapper";
import type { ProfilePicture } from "../../quarks/image-index";
import { ImageIndex } from "../../quarks/image-index";
import { UsersIndex } from "../../quarks/users-index";
import { SlackService } from "../../services/slack-service/slack-service";

export type UserProfilePictureProps = {
  userID?: string;
  imageResolution?: ProfilePicture["size"];
  width?: number;
  height?: number;
  verticalAlign?: Align;
  horizontalAlign?: Align;
  fallbackImage?: string;
} & MarginProps;

export const UserProfilePicture = (props: UserProfilePictureProps) => {
  const profilePicture = ImageIndex.useProfilePicture(
    props.userID,
    props.imageResolution ?? 32
  );

  React.useEffect(() => {
    (async () => {
      if (
        props.userID &&
        !profilePicture &&
        ImageIndex.get().firsLoadCompleted
      ) {
        let user = UsersIndex.get().users.find((u) => u.id === props.userID);
        if (!user) {
          user = await SlackService.loadUserInfo(props.userID);
        }
        SlackService.loadUserProfilePictures(user);
      }
    })();
  }, [props.userID]);

  if (!profilePicture && !props.fallbackImage) {
    return (
      <Box
        widthRequest={props.width}
        heightRequest={props.height}
        verticalAlign={props.verticalAlign}
        horizontalAlign={props.horizontalAlign}
        margin={props.margin}
      />
    );
  }

  return (
    <Image
      src={profilePicture?.fileLocation ?? props.fallbackImage!}
      resizeToWidth={props.width}
      resizeToHeight={props.height}
      verticalAlign={props.verticalAlign}
      horizontalAlign={props.horizontalAlign}
      margin={props.margin}
    />
  );
};
