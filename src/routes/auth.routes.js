import { Router } from "express";
import {
  forgotPassValidators,
  resendVerifcationEmailValidators,
  resetPassValidators,
  userloginValidators,
  userRegistrationvalidators,
} from "../validators/auth.validators.js";
import validators from "../middlewares/validations.middlewares.js";
import {
  forgotPass,
  getProfile,
  loginUser,
  logOut,
  resendverificationemail,
  resetPass,
  userRegister,
  verifyUser,
} from "../controllers/auth.controllers.js";
import isloggedIn from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  userRegistrationvalidators(),
  validators,
  userRegister,
);
router.get("/verify/:token", verifyUser);
router.post(
  "/resend-verifyEmail/:token",
  resendVerifcationEmailValidators(),
  validators,
  resendverificationemail,
);
router.post("/login", userloginValidators(), validators, loginUser);
router.get("/getMe", isloggedIn, getProfile);
router.get("/logOut", isloggedIn, logOut);
router.get("/forgotPass", forgotPassValidators(), validators, forgotPass);
router.post("/resetPass/:token", resetPassValidators(), validators, resetPass);
router.post(
  "/resetCurrentPass",
  isloggedIn,
  resetPassValidators(),
  validators,
  resetPass,
);
export default router;
