import { useEffect, useState } from "react";
import {
  Authenticator,
  Heading,
  Text,
  ThemeProvider,
  defaultDarkModeOverride,
  useTheme,
} from "@aws-amplify/ui-react";
import App from "../app";
import { Amplify, Auth, Hub } from "aws-amplify";
import { AppConfig } from "../common/types";
import { AppContext } from "../common/app-context";
import { Alert, StatusIndicator, TextContent } from "@cloudscape-design/components";
import { StorageHelper } from "../common/helpers/storage-helper";
import { Mode } from "@cloudscape-design/global-styles";
import "@aws-amplify/ui-react/styles.css";
import { CHATBOT_NAME } from "../common/constants";
import FederatedSignIn from "./authentication/federated-signin";

// "aws.cognito.signin.user.admin"

export default function AppConfigured() {
  const { tokens } = useTheme();
  const [token, setToken] = useState(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState<boolean | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(null);
  const [theme, setTheme] = useState(StorageHelper.getTheme());
  const [user, setUser] = useState<any | null>(null);


  const federatedIdName : string = "AzureAD-OIDC-MassGov";
  // let authenticated = false;

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      console.log(payload)
      // switch (payload.event) {
      //   case "signInWithRedirect":
      //     getUser();
      //     break;
      //   case "signInWithRedirect_failure":
      //     setError("An error has occurred during the OAuth flow.");
      //     break;
      //   case "customOAuthState":
      //     setCustomState(payload.data); // this is the customState provided on signInWithRedirect function
      //     break;
      // }
    });

    // getUser();

    return unsubscribe;
  }, []);

  useEffect(() => {
    (async () => {
      try {     
        const result = await fetch("/aws-exports.json");
        const awsExports = await result.json();
        Amplify.configure(awsExports);   
        const currentUser = await Auth.currentAuthenticatedUser();
        console.log("Authenticated user:", currentUser);
        setAuthenticated(true);
        console.log(authenticated);
      } catch (e) {
        console.error("Authentication check error:", e);
        setAuthenticated(false);
      }
    })();
  }, []);
  
  useEffect(() => {    
    // (async () => {
    console.log("Auth state changed!", authenticated)
    //     const result = await fetch("/aws-exports.json");
    //     const awsExports = await result.json();
    //     Amplify.configure(awsExports);   
    if (!authenticated) {
      console.log("No authenticated user, initiating federated sign-in.");
      Auth.federatedSignIn({ customProvider: federatedIdName });
    }
  // })
  }, [authenticated]);

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
        <TextContent>{authenticated}</TextContent>
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
          <TextContent>Are we authenticated: {authenticated}</TextContent>
        )}
      </ThemeProvider>
    </AppContext.Provider>
  );
}
