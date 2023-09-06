import React from "react";
import { Align, Label } from "react-gjs-renderer";
import { UsersIndex } from "../../../../quarks/users-index";
import { SlackService } from "../../../../services/slack-service/slack-service";

export const UserTyping = (props: { userID: string }) => {
  const userInfo = UsersIndex.useUser(props.userID);

  React.useEffect(() => {
    const service = SlackService.getService();
    if (!userInfo && service) {
      service.users.getUser(props.userID);
    }
  }, [userInfo]);

  if (!userInfo) return <Label></Label>;
  return (
    <Label horizontalAlign={Align.START}>{userInfo.name} is typing.</Label>
  );
};
