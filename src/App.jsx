import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import NavigationTracker from "@/lib/NavigationTracker";
import { pagesConfig } from "./pages.config";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import Analytics from "./pages/Analytics";
import CalendarView from "./pages/CalendarView";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );

const isPublicRouteKey = (key) =>
  key === "Auth" || key === "Home" || key === "Landing";

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const userStr = localStorage.getItem("esds_user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return (
      <Navigate
        to="/Auth?team=sales"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <NavigationTracker />
        <Routes>
          <Route
            path="/"
            element={
              isPublicRouteKey(mainPageKey) ? (
                <LayoutWrapper currentPageName={mainPageKey}>
                  <MainPage />
                </LayoutWrapper>
              ) : (
                <RequireAuth>
                  <LayoutWrapper currentPageName={mainPageKey}>
                    <MainPage />
                  </LayoutWrapper>
                </RequireAuth>
              )
            }
          />
          {Object.entries(Pages).map(([path, Page]) => {
            const element = (
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            );
            const wrapped = isPublicRouteKey(path) ? (
              element
            ) : (
              <RequireAuth>{element}</RequireAuth>
            );
            return (
              <Route key={path} path={`/${path}`} element={wrapped} />
            );
          })}
          <Route
            path="/Analytics"
            element={
              <RequireAuth>
                <Analytics />
              </RequireAuth>
            }
          />
          <Route
            path="/CalendarView"
            element={
              <RequireAuth>
                <CalendarView />
              </RequireAuth>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App