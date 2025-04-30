import { useEffect, useState } from "react";
import axios from "axios";

const RecoverAccount = () => {
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      axios
        .post("http://localhost:5000/api/auth/recover-account", { token })
        .then(() => setStatus("Your account has been recovered. You can now log in."))
        .catch(() => setStatus("Invalid or expired token."));
    } else {
      setStatus("Invalid recovery link.");
    }
  }, []);

  return <p>{status}</p>;
};

export default RecoverAccount;
