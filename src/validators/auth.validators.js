import { body } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

const userRegistrationvalidators = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is requried")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password").trim().notEmpty().withMessage("Password is requried"),
  ];
};
const resendVerifcationEmailValidators = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is requried")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};
const userloginValidators = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is requried")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password").trim().notEmpty().withMessage("Password is requried"),
  ];
};
const forgotPassValidators = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is requried")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};
const resetPassValidators = () => {
  return [
    body("password").trim().notEmpty().withMessage("Password is requried"),
    body("confirmPassword")
      .trim()
      .notEmpty()
      .withMessage("Confirm Password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new ApiError(400, "Both passwords must match");
        }
        return true;
      }),
  ];
};

export {
  userRegistrationvalidators,
  resendVerifcationEmailValidators,
  userloginValidators,
  forgotPassValidators,
  resetPassValidators,
};
