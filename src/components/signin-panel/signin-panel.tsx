import React from "react";
import {
  Align,
  Box,
  Button,
  Orientation,
  Spinner,
  TextInput,
} from "react-gjs-renderer";
import { AuthorizationAdapter } from "../../adapters/authorization/authorization-adapter";
import { useLoadState } from "../../hooks/use-load-state";
import { navigate } from "../../main-stack";
import { ImageIndex } from "../../quarks/image-index";
import { SlackClient } from "../../quarks/slack-client";
import { SlackUser } from "../../quarks/user";
import { SlackService } from "../../services/slack-service/slack-service";
import { AppMarkup } from "../app-markup/app-markup";

const SignInInput = (props: {
  value: string;
  onChange: (v: string) => void;
}) => {
  return (
    <TextInput
      widthRequest={400}
      horizontalAlign={Align.CENTER}
      margin={[10, 0]}
      value={props.value}
      onChange={(v) => props.onChange(v.text)}
    />
  );
};

export const SignInPanel = () => {
  const currentUser = SlackUser.use();
  const profilePicture = ImageIndex.useProfilePicture(currentUser.value.id);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [team, setTeam] = React.useState("");

  const [isLoading, setIsLoading] = useLoadState(false);

  const authorize = () => {
    if (email.length < 1 || password.length < 1 || team.length < 1) {
      return;
    }

    setIsLoading(true);

    AuthorizationAdapter.logIn(team, email, password)
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    (async () => {
      if (currentUser.value.loggedIn && !SlackClient.get().client) {
        try {
          setIsLoading(true);
          await AuthorizationAdapter.authorize(
            currentUser.value.accessToken,
            currentUser.value.id
          );
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [currentUser.value.loggedIn]);

  React.useEffect(() => {
    if (currentUser.value.loggedIn && profilePicture == null) {
      SlackService.loadUserProfilePictures(currentUser.value);
    }

    if (currentUser.value.loggedIn) {
      navigate("chat");
    }
  }, [currentUser.value.loggedIn]);

  return (
    <Box
      expand
      orientation={Orientation.VERTICAL}
      horizontalAlign={Align.FILL}
      verticalAlign={Align.CENTER}
    >
      {isLoading ? (
        <Spinner />
      ) : currentUser.value.loggedIn ? (
        <Spinner />
      ) : (
        <Box>
          <AppMarkup>Team:</AppMarkup>
          <SignInInput value={team} onChange={(v) => setTeam(v)} />
          <AppMarkup>Email:</AppMarkup>
          <SignInInput value={email} onChange={(v) => setEmail(v)} />
          <AppMarkup>Password:</AppMarkup>
          <SignInInput value={password} onChange={(v) => setPassword(v)} />
          <Button horizontalAlign={Align.END} onClick={authorize}>
            Submit
          </Button>
        </Box>
      )}
    </Box>
  );
};
