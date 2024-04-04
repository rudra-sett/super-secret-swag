import { useContext } from "react";
import {
  BrowserRouter,
  HashRouter,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AppContext } from "./common/app-context";
import GlobalHeader from "./components/global-header";
import Playground from "./pages/chatbot/playground/playground";
import NotFound from "./pages/not-found";
// import AddData from "./pages/rag/add-data/add-data";
// import CreateWorkspace from "./pages/rag/create-workspace/create-workspace";
// import Dashboard from "./pages/rag/dashboard/dashboard";
// import RssFeed from "./pages/rag/workspace/rss-feed";
// import WorkspacePane from "./pages/rag/workspace/workspace";
// import Workspaces from "./pages/rag/workspaces/workspaces";
import "./styles/app.scss";
// import SessionPage from "./pages/chatbot/sessions/sessions";

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
            <Route index path="/" element={<Playground />} />
            <Route path="/chatbot" element={<Outlet />}>
              <Route path="playground" element={<Playground />} />
              <Route path="playground/:sessionId" element={<Playground />} />
              {/* <Route path="sessions" element={<SessionPage />} /> if we want history*/}
            </Route>
            {/* <Route path="/rag" element={<Outlet />}>
              <Route path="" element={<Dashboard />} />
              <Route path="workspaces" element={<Workspaces />} />
              <Route path="workspaces/create" element={<CreateWorkspace />} />
              <Route
                path="workspaces/:workspaceId"
                element={<WorkspacePane />}
              />
              <Route
                path="workspaces/:workspaceId/rss/:feedId"
                element={<RssFeed />}
              />
              <Route path="workspaces/add-data" element={<AddData />} />
            </Route> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
