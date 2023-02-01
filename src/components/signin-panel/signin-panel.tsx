import React from "react";
import {
  Align,
  Box,
  Button,
  Image,
  Label,
  Markup,
  Orientation,
  Span,
  Spinner,
  TextInput,
} from "react-gjs-renderer";
import { AuthorizationAdapter } from "../../adapters/authorization/authorization-adapter";
import { useLoadState } from "../../hooks/use-load-state";
import { ImageIndex } from "../../quarks/image-index";
import { SlackClient } from "../../quarks/slack-client";
import { SlackUser } from "../../quarks/user";

const SignInInput = (props: {
  value: string;
  onChange: (v: string) => void;
}) => {
  return (
    <TextInput
      ref={(ref) => {
        if (ref) {
          ref.widget.width_request = 150;
        }
      }}
      horizontalAlign={Align.CENTER}
      margin={[4, 48]}
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
      const pfp = {
        link: "",
        size: 1024 as 24 | 32 | 48 | 72 | 192 | 512 | 1024,
      };

      if (currentUser.value.image.px1024) {
        pfp.link = currentUser.value.image.px1024;
        pfp.size = 1024;
      } else if (currentUser.value.image.px512) {
        pfp.link = currentUser.value.image.px512;
        pfp.size = 512;
      } else if (currentUser.value.image.px192) {
        pfp.link = currentUser.value.image.px192;
        pfp.size = 192;
      } else if (currentUser.value.image.px72) {
        pfp.link = currentUser.value.image.px72;
        pfp.size = 72;
      } else if (currentUser.value.image.px48) {
        pfp.link = currentUser.value.image.px48;
        pfp.size = 48;
      } else if (currentUser.value.image.px32) {
        pfp.link = currentUser.value.image.px32;
        pfp.size = 32;
      } else if (currentUser.value.image.px24) {
        pfp.link = currentUser.value.image.px24;
        pfp.size = 24;
      }

      fetch(pfp.link)
        .then(async (response) => {
          const buff = new Uint8Array(await response.arrayBuffer());

          ImageIndex.addProfilePicture(currentUser.value.id!, pfp.size, buff);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [currentUser.value.loggedIn]);

  return (
    <Box
      expandHorizontal
      orientation={Orientation.VERTICAL}
      horizontalAlign={Align.FILL}
    >
      {isLoading ? (
        <Spinner />
      ) : currentUser.value.loggedIn ? (
        <>
          <Markup>
            <Span fontSize={24}>
              You are logged in{" "}
              {currentUser.value.displayName ?? currentUser.value.name}!
            </Span>
          </Markup>
          {profilePicture && <Image src={profilePicture.fileLocation} />}
        </>
      ) : (
        <>
          <Label>Team:</Label>
          <SignInInput value={team} onChange={(v) => setTeam(v)} />
          <Label>Email:</Label>
          <SignInInput value={email} onChange={(v) => setEmail(v)} />
          <Label>Password:</Label>
          <SignInInput value={password} onChange={(v) => setPassword(v)} />
          <Button onClick={authorize}>Submit</Button>
        </>
      )}
    </Box>
  );
};
