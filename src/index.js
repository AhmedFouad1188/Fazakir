import React from "react";
import ReactDOM from "react-dom/client"; // ✅ Import from "react-dom/client"
import { Provider } from "react-redux";
import store from "./redux/store"; // ✅ Correct store import
import App from "./App";
import { AuthProvider } from "./context/AuthContext"; // ✅ Import AuthProvider

const root = ReactDOM.createRoot(document.getElementById("root")); // ✅ Use createRoot()
root.render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>
);
