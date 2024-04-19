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
                    Auth.federatedSignIn({provider: props.federatedIdName})
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