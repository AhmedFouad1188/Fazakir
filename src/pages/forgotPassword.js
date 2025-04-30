import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent! Check your email.");
    } catch (error) {
      console.error("Error:", error.message);
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
    <h2 style={{textAlign: "center", marginTop: "5vw"}}>إعادة تعيين كلمة المرور الخاصة بك</h2>
    <form onSubmit={handleResetPassword} style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2vw", marginTop: "5vw"}}>
      <input
        type="email"
        placeholder="أدخل الايميل الالكترونى الخاص بحسابك"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" style={{width: "15vw", height: "3vw", cursor: "pointer"}}>إعادة تعيين كلمة المرور</button>
    </form>
    </div>
  );
};

export default ForgotPassword;
