import React from "react";
import { AuthorizationAdapter } from "../../adapters/authorization/authorization-adapter";
import { UserQuark } from "../../quarks/user";
import { Button } from "../../valence-reexports/button";
import { Text } from "../../valence-reexports/text";
import { TextInput } from "../../valence-reexports/text-input";
import { View } from "../../valence-reexports/view";

export const SignInPanel = () => {
  const currentUser = UserQuark.use();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [team, setTeam] = React.useState("");

  return (
    <View>
      {currentUser.value.loggedIn ? (
        <View>
          <Text>You are logged in!</Text>
          <Button
            onPress={() => {
              // AuthorizationAdapter.signOut();
            }}
          >
            Logout
          </Button>
        </View>
      ) : (
        <View>
          <Text>Team:</Text>
          <TextInput value={team} onChangeText={(v) => setTeam(v)} />
          <Text>Email:</Text>
          <TextInput value={email} onChangeText={(v) => setEmail(v)} />
          <Text>Password:</Text>
          <TextInput value={password} onChangeText={(v) => setPassword(v)} />
          <Button
            onPress={() =>
              AuthorizationAdapter.authorize(team, email, password)
            }
          >
            Submit
          </Button>
        </View>
      )}
    </View>
  );
};
