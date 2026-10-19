import { useEffect, useState } from "react";

import Header from "./components/Header";
import NavTabs from "./components/NavTabs";
import PageHeading from "./components/PageHeading";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import StockMovements from "./pages/StockMovements";
import POS from "./pages/POS";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import ActivityLogs from "./pages/ActivityLogs";

import { useAuth } from "./hooks/useAuth";
import { useDashboard } from "./hooks/useDashboard";
import { useProducts } from "./hooks/useProducts";
import { useCategories } from "./hooks/useCategories";
import { useSuppliers } from "./hooks/useSuppliers";
import { usePurchaseOrders } from "./hooks/usePurchaseOrders";
import { useStockMovements } from "./hooks/useStockMovements";
import { usePOS } from "./hooks/usePOS";
import { useSales } from "./hooks/useSales";
import { useReports } from "./hooks/useReports";
import { useUsers } from "./hooks/useUsers";
import { useActivityLogs } from "./hooks/useActivityLogs";

import { getPageHeading } from "./utils/pageMeta";

import "./App.css";

function App() {
  // App-level state: who is signed in and which screen is open.
  const auth = useAuth();
  const { authUser, expireSession } = auth;
  const [module, setModule] = useState("dashboard");

  // Each hook holds the data and actions of one screen.
  // They stay here (not inside the pages) so state survives switching tabs.
  const dashboard = useDashboard({ authUser, module });
  const products = useProducts({ authUser, module });
  const categories = useCategories({ authUser, module });
  const suppliers = useSuppliers({ authUser, module });
  const purchaseOrders = usePurchaseOrders({ authUser, module });
  const stockMovements = useStockMovements({ authUser, module });
  const pos = usePOS({
    authUser,
    module,
    setStockMovements: stockMovements.setStockMovements,
  });
  const sales = useSales({ authUser, module });
  const reports = useReports({ authUser, module });
  const users = useUsers({ authUser, module });
  const activityLogs = useActivityLogs({ authUser, module });

  const { resetSale } = pos;

  // Open another screen and clear messages/forms left over on the old ones.
  const switchModule = (next) => {
    setModule(next);
    products.resetFeedback();
    categories.resetFeedback();
    suppliers.resetFeedback();
    purchaseOrders.resetFeedback();
    stockMovements.resetFeedback();
  };

  const handleLogout = () => {
    if (!auth.logout()) return;
    resetSale();
    setModule("dashboard");
  };

  // api.js fires this event when the backend rejects the saved login.
  useEffect(() => {
    const handleSessionExpired = () => {
      expireSession();
      resetSale();
      setModule("dashboard");
    };

    window.addEventListener("coursecart:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener(
        "coursecart:session-expired",
        handleSessionExpired,
      );
    };
  }, [expireSession, resetSale]);

  if (auth.authChecking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <p>Verifying your session...</p>
      </main>
    );
  }

  if (!authUser) {
    return (
      <Login
        loginEmail={auth.loginEmail}
        setLoginEmail={auth.setLoginEmail}
        loginPassword={auth.loginPassword}
        setLoginPassword={auth.setLoginPassword}
        loginError={auth.loginError}
        loginLoading={auth.loginLoading}
        handleLogin={auth.handleLogin}
      />
    );
  }

  const heading = getPageHeading(
    module,
    {
      productView: products.productView,
      categoryView: categories.categoryView,
      supplierView: suppliers.supplierView,
    },
    {
      dashboard: dashboard.products.length,
      "activity-logs": activityLogs.activityLogs.length,
      users: users.users.length,
      products: products.displayedProducts.length,
      categories: categories.displayedCategories.length,
      suppliers: suppliers.displayedSuppliers.length,
      "purchase-orders": purchaseOrders.purchaseOrders.length,
      "stock-movements": stockMovements.stockMovements.length,
      sales: sales.sales.length,
      pos: pos.posProducts.length,
    },
  );

  return (
    <main className="app">
      <Header
        authUser={authUser}
        onLogout={handleLogout}
        role={authUser.role}
        module={module}
        onSelect={switchModule}
      />
      <div className="workspace">
        <section className="page-content">
          <PageHeading {...heading} />
          <section className="inventory-panel">

          {module === "users" && authUser.role === "admin" && (
            <UserManagement authUser={authUser} {...users} />
          )}
          {module === "activity-logs" && authUser.role === "admin" && (
            <ActivityLogs
              {...activityLogs}
              onRefresh={activityLogs.refreshActivityLogs}
            />
          )}
          {module === "dashboard" && (
            <Dashboard
              authUser={authUser}
              switchModule={switchModule}
              {...dashboard}
            />
          )}
          {module === "products" && (
            <Products
              authUser={authUser}
              {...products}
            />
          )}
          {module === "categories" && <Categories {...categories} />}
          {module === "suppliers" && <Suppliers {...suppliers} />}
          {module === "pos" && <POS {...pos} />}
          {module === "sales" && <Sales {...sales} />}
          {module === "reports" && authUser.role === "admin" && (
            <Reports {...reports} />
          )}
          {module === "stock-movements" && (
            <StockMovements {...stockMovements} />
          )}
          {module === "purchase-orders" && (
            <PurchaseOrders {...purchaseOrders} />
          )}
          </section>
        </section>
        <footer className="footer">
          CourseCart · School Supplies POS & Inventory
        </footer>
      </div>
    </main>
  );
}

export default App;
