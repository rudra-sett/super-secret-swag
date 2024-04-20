import { useEffect, useState } from "react";
import {
  Authenticator,
  Heading,
  ThemeProvider,
  defaultDarkModeOverride,
  useTheme,
} from "@aws-amplify/ui-react";
import App from "../app";
import { Amplify, Auth, Hub } from "aws-amplify";
import { AppConfig } from "../common/types";
import { AppContext } from "../common/app-context";
import { Alert, StatusIndicator } from "@cloudscape-design/components";
import { StorageHelper } from "../common/helpers/storage-helper";
import { Mode } from "@cloudscape-design/global-styles";
import "@aws-amplify/ui-react/styles.css";
import { CHATBOT_NAME } from "../common/constants";
import FederatedSignIn from "./authentication/federated-signin";

export default function AppConfigured() {
  const { tokens } = useTheme();
  const [token, setToken] = useState(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<boolean | null>(null);
  const [theme, setTheme] = useState(StorageHelper.getTheme());

  const federatedIdName : string = "AzureAD-OIDC-MassGov";
  let authenticated = false;

  useEffect(() => {
    (async () => {
      try {
        const result = await fetch("/aws-exports.json");
        const awsExports = await result.json();
        const currentConfig = Amplify.configure(awsExports) as AppConfig | null;
        console.log("checking auth");
        // if (currentConfig?.config.auth_federated_provider?.auto_redirect) {          
          try {
            const user = await Auth.currentAuthenticatedUser();
            if (user) {
              authenticated = true;
            }
          } catch (e) {
            authenticated = false;
          }

          if (!authenticated) {
            console.log('hi');
            Auth.federatedSignIn({customProvider: federatedIdName}) 
            // const federatedProvider =
            //   currentConfig.config.auth_federated_provider;

            // if (!federatedProvider.custom) {
            //   // Auth.federatedSignIn({ provider: federatedProvider.name });
            // } else {
            //   // Auth.federatedSignIn({ customProvider: federatedProvider.name });
            //   Auth.federatedSignIn({customProvider: federatedIdName})    
            // }

            return;
          }
        // }

        setConfig(currentConfig);
      } catch (e) {
        console.error(e);
        setError(true);
      }
    })();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const newValue =
            document.documentElement.style.getPropertyValue(
              "--app-color-scheme"
            );

          const mode = newValue === "dark" ? Mode.Dark : Mode.Light;
          if (mode !== theme) {
            setTheme(mode);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
    };
  }, [theme]);

  if (!config) {
    if (error) {
      return (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Alert header="Configuration error" type="error">
            Error loading configuration from "
            <a href="/aws-exports.json" style={{ fontWeight: "600" }}>
              /aws-exports.json
            </a>
            "
          </Alert>
        </div>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusIndicator type="loading">Loading</StatusIndicator>
      </div>
    );
  }

  function getToken() {
    return Auth.currentSession()
      .then(session => session.getAccessToken().getJwtToken())
      .catch(err => console.log(err));
  }

  // useEffect(() => {
  //   Hub.listen("auth", ({payload: {event, data}}) => {
  //     switch (event) {
  //       case "signIn":
  //       case "cognitoHostedUI":
  //         setToken("grating...");
  //         getToken().then(userToken => setToken(userToken));
  //         break;
  //       case "signOut":
  //         setToken(null);
  //         break;
  //       case "signIn_failure":
  //       case "cognitoHostedUI_failure":
  //         console.log("Sign in failure", data);
  //         break;
  //       default:
  //         break;
  //     }
  //   });
  // }, []);

  return (
    <AppContext.Provider value={config}>
      <ThemeProvider
        theme={{
          name: "default-theme",
          overrides: [defaultDarkModeOverride],
        }}
        colorMode={theme === Mode.Dark ? "dark" : "light"}
      >
        {/* <Authenticator
          hideSignUp={true}
          components={{
            SignIn: {
              Header: () => {
                return (
                  <Heading
                    padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}
                    level={3}
                  >
                    {CHATBOT_NAME}
                  </Heading>
                );
              },
            },
          }}
        >
          <App />
        </Authenticator> */}
        {authenticated ? (
          <App/>
        ) : (
          // <FederatedSignIn federatedIdName={federatedIdName}/>
          <></>
        )}
      </ThemeProvider>
    </AppContext.Provider>
  );
}
