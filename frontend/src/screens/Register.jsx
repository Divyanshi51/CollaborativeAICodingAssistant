import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import CustomAlert from "./CustomAlert";
import "../stylesheets/login.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setUser } = useContext(UserContext);
  const [alertConfig, setAlertConfig] = useState({ show: false, msg: "" });
  const navigate = useNavigate();

  function submitHandler(e) {
    e.preventDefault();

    axios
      .post("/users/register", {
        email,
        password,
      })
      .then((res) => {
        // console.log(res.data);
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/");
      })
      .catch((err) => {
        console.log(err.response.data);
        const errorMsg = err.response?.data?.message || "User Already Exist!";
        setAlertConfig({ show: true, msg: errorMsg });
      });
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Register</h2>
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              s
              type="password"
              id="password"
              placeholder="Enter your password"
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account?{" "}
          <Link to="/login" className="link">
            Login
          </Link>
        </p>
      </div>
      <CustomAlert
        isOpen={alertConfig.show}
        message={alertConfig.msg}
        onClose={() => setAlertConfig({ ...alertConfig, show: false })}
      />
    </div>
  );
};

export default Register;
