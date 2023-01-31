import React from "react";
import {
  Box,
  Button,
  Label,
  Markup,
  Orientation,
  Span,
  TextInput,
} from "react-gjs-renderer";
import { AuthorizationAdapter } from "../../adapters/authorization/authorization-adapter";
import { UserQuark } from "../../quarks/user";

export const SignInPanel = () => {
  const currentUser = UserQuark.use();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [team, setTeam] = React.useState("");

  return (
    <Box orientation={Orientation.VERTICAL}>
      {currentUser.value.loggedIn ? (
        <>
          <Markup>
            <Span fontSize={24}>You are logged in!</Span>
          </Markup>
          <Button
            onClick={() => {
              // AuthorizationAdapter.signOut();
            }}
          >
            Logout
          </Button>
        </>
      ) : (
        <>
          <Label>Team:</Label>
          <TextInput value={team} onChange={(v) => setTeam(v.text)} />
          <Label>Email:</Label>
          <TextInput value={email} onChange={(v) => setEmail(v.text)} />
          <Label>Password:</Label>
          <TextInput value={password} onChange={(v) => setPassword(v.text)} />
          <Button
            onClick={() => {
              AuthorizationAdapter.authorize(team, email, password).then(
                () => {
                  console.log("Signed in!");
                },
                (err) => {
                  console.log(err);
                }
              );
            }}
          >
            Submit
          </Button>
        </>
      )}
    </Box>
  );
};
