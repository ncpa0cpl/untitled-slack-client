import envs from "gapp:env";
import Secret from "gi://Secret";

const SCHEMA = new Secret.Schema(
  `${envs.appId}.password`,
  Secret.SchemaFlags.NONE,
  {
    userID: Secret.SchemaAttributeType.STRING,
  }
);

class KeyringServiceImpl {
  store(userID: string, secretName: string, secret: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        Secret.Service.password_store(
          SCHEMA,
          { userID },
          Secret.COLLECTION_DEFAULT,
          secretName,
          secret,
          null,
          (_, result) => {
            try {
              Secret.Service.password_store_finish(result);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  lookup(userID: string, secretName: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        Secret.Service.password_lookup(
          SCHEMA,
          { userID },
          null,
          (_, result) => {
            try {
              const secret = Secret.Service.password_lookup_finish(result);
              resolve(secret);
            } catch (e) {
              reject(e);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }
}

export const KeyringService = new KeyringServiceImpl();
