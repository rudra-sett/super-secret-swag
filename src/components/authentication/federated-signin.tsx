import React from "react";
import {Container, SpaceBetween, Button, Header, TextContent} from "@cloudscape-design/components";
import {Auth} from "aws-amplify";

function FederatedSignIn(props) {
  return (
    <Container>
      {/* <Col sm={3}></Col> */}
      {/* <Col sm={6}> */}
        <Container>
          <Container>
            <Header>
              <h3 style={{textAlign: "center"}}>Welcome</h3>
            </Header>
            <TextContent>
              In order to proceed please click to authenticate
            </TextContent>
            {/* <Row>
              <Col sm={3}></Col>
              <Col sm={6}> */}
                {" "}
                <Button
                  // block
                  // variant="success"
                  onClick={() =>
                    // Auth.federatedSignIn({provider: props.federatedIdName})
                    window.location.href = 'https://sandbox-mass-gov.auth.us-east-1.amazoncognito.com/oauth2/authorize?identity_provider=AzureAD-OIDC-MassGov&redirect_uri=https://d2gm26s9pysaci.cloudfront.net&response_type=CODE&client_id=4qn890ga2uh7a04ia5hkqaep3b&state=HbWGIGW7wr7yUC7s2soOekJAdin9XYvH&code_challenge=kbTrn-hvyrAksfZeai4-G4pjepOaDBi1s9uN9cQlobg&code_challenge_method=S256&scope=email openid profile'
                    // return null;
                    // window.location.href='';
                  }
                >
                  Federated Sign In
                </Button>
              {/* </Col>
              <Col sm={3}> </Col>
            </Row> */}
          </Container>
        </Container>
      {/* </Col> */}
      {/* <Col sm={3}></Col> */}
    </Container>
  );
}

export default FederatedSignIn;