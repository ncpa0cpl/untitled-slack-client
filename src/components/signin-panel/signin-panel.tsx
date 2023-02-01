import type GdkPixbuff from "gi://GdkPixbuf";
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
import { SlackClientQuark } from "../../quarks/slack-client";
import { UserQuark } from "../../quarks/user";

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
  const currentUser = UserQuark.use();

  const [userImage, setUserImage] = React.useState<GdkPixbuff.Pixbuf | null>(
    null
  );

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
      if (currentUser.value.loggedIn && !SlackClientQuark.get().client) {
        try {
          setIsLoading(true);
          await AuthorizationAdapter.authorize(
            currentUser.value.accessToken,
            currentUser.value.id
          );
        } catch (e) {
          console.log(e);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [currentUser.value.loggedIn]);

  React.useEffect(() => {
    if (currentUser.value.loggedIn) {
      fetch(currentUser.value.image.px192!)
        .then(async (response) => {
          console.log(await response.text());
          // const buff = await response.arrayBuffer();
          // const uint8 = new Uint8Array(buff);

          // await writeFile("/home/owner/slack-image.jpg", uint8);

          // const image = GdkPixbuff.Pixbuf.new_from_file(
          //   "/home/owner/slack-image.jpg"
          // );
          // setUserImage(image);
        })
        .catch((e) => {
          console.log(e);
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
          {userImage && <Image src={userImage} />}
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
