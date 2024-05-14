import { useContext } from "react";
import {
  BrowserRouter,
  HashRouter,
  Outlet,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AppContext } from "./common/app-context";
import GlobalHeader from "./components/global-header";
import Playground from "./pages/chatbot/playground/playground";
import NotFound from "./pages/not-found";
// import WorkspacePane from "./pages/admin/workspace";
import AddData from "./pages/admin/add-data";
//import WorkspacePane from "./pages/admin/workspace";
import UserFeedbackPage from "./pages/admin/user-feedback";
import SessionPage from "./pages/chatbot/sessions/sessions"
import { v4 as uuidv4 } from "uuid";
import "./styles/app.scss";

function App() {
  const appContext = useContext(AppContext);
  const Router = appContext?.config.privateWebsite ? HashRouter : BrowserRouter;

  return (
    <div style={{ height: "100%" }}>
      <Router>
        <GlobalHeader />
        <div style={{ height: "56px", backgroundColor: "#000716" }}>&nbsp;</div>
        <div>
          <Routes>            
            <Route
                index
                path="/"
                element={<Navigate to={`/chatbot/playground/${uuidv4()}`} replace />}
            />            
            <Route path="/chatbot" element={<Outlet />}>
              <Route path="playground" element={<Playground />} />
              <Route path="playground/:sessionId" element={<Playground />} />
              {/* <Route path="sessions" element={<SessionPage />} /> if we want history*/}
             {/* <Route path="data" element={<WorkspacePane />} />    */}
             <Route path="user-feedback" element={<UserFeedbackPage />} />                           
            </Route>            
            <Route path="*" element={<Navigate to={`/chatbot/playground/${uuidv4()}`} replace />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
