import React from "react";
import {
  Align,
  Box,
  Button,
  Orientation,
  Spinner,
  TextInput,
} from "react-gjs-renderer";
import { useAsyncOperation } from "../../hooks/use-async-operation";
import { navigate } from "../../main-stack";
import { UserQuark } from "../../quarks/user";
import { SlackService } from "../../services/slack-service/slack-service";
import { AppMarkup } from "../app-markup/app-markup";

type AuthArg =
  | {
      authVia: "credentials";
      team: string;
      email: string;
      password: string;
    }
  | {
      authVia: "token";
      team: string;
      token: string;
      userId: string;
    };

const authOperation = async (args: AuthArg) => {
  if (args.authVia === "credentials") {
    const { team, email, password } = args;

    if (email.length < 1 || password.length < 1 || team.length < 1) {
      return;
    }

    return await SlackService.auth.logIn(team, email, password);
  } else {
    const { team, token, userId } = args;
    return await SlackService.auth.authorizeUser(team, token, userId);
  }
};

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
  const currentUser = UserQuark.use();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [team, setTeam] = React.useState("");

  const authorization = useAsyncOperation(authOperation);

  React.useEffect(() => {
    (async () => {
      if (currentUser.value.loggedIn) {
        authorization.execute({
          authVia: "token",
          team: currentUser.value.teamID,
          userId: currentUser.value.id,
          token: currentUser.value.accessToken,
        });
      }
    })();
  }, [currentUser.value.loggedIn]);

  React.useEffect(() => {
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
      {authorization.loading.state ? (
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
          <Button
            horizontalAlign={Align.END}
            onClick={() =>
              authorization.execute({
                authVia: "credentials",
                email,
                password,
                team,
              })
            }
          >
            Submit
          </Button>
        </Box>
      )}
    </Box>
  );
};
