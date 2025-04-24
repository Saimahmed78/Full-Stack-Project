import User from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asynchandler.js";
import {
  emailVerificationConfirmationContent,
  emailVerificationContent,
  resetPasswordEmailContent,
  sendMail,
} from "../utils/mail.js";
const userRegister = asyncHandler(async (req, res) => {
  // get email and password from the user
  const { name, email, password } = req.body;
  // then find the user by email
  const existingUser = await User.findOne({ email });
  // if user exist then send error
  if (existingUser)
    throw new ApiError(409, "Validation failed", ["User already exist"]);
  //Create a user
  const newUser = await User.create({
    name,
    email,
    password,
  });
  // if not exist then create verification token and verification
  const { token, hashedToken, tokenExpiry } = await newUser.generateTempToken();
  // save in db
  newUser.verificationToken = hashedToken;
  newUser.verificationTokenExpiry = tokenExpiry;
  //Check if the tokens are generated ,
  if (!newUser.verificationToken && !newUser.verificationTokenExpiry) {
    throw new ApiError(400, "User registration is failed", [
      "Verification token failed",
      "Verifcation Token expiry failed",
    ]);
  }
  //if yes,  save user
  await newUser.save();
  //send Mail
  const verificationURL = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;
  try {
    await sendMail({
      email: newUser.email,
      subject: "User Verification Email",
      mailGenContent: emailVerificationContent(name, verificationURL),
    });
  } catch (err) {
    throw new ApiError(400, "Email Verification failed", err);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User is registered and Verification Email sent successfully",
      ),
    );
});
const verifyUser = asyncHandler(async (req, res) => {
  // get token from req.params
  const { token } = req.params;

  // validate it
  if (!token) {
    throw new ApiError(404, "Token not found");
  }
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  console.log(hashedToken);
  // find user by token
  const userToVerify = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpiry: { $gt: Date.now() },
  });
  // if user do not exist send error
  if (!userToVerify) {
    throw new ApiError(404, "User not found. Maybe Token is invalid");
  }
  // if user exist empty the tokens
  userToVerify.verificationToken = undefined;
  userToVerify.verificationTokenExpiry = undefined;
  const name = userToVerify.name;
  // verify the user
  userToVerify.isVerified = true;
  // save the user

  await userToVerify.save();
  // send email to User
  try {
    await sendMail({
      email: userToVerify.email,
      subject: "Email Verification Confirmation",
      mailGenContent: emailVerificationConfirmationContent(name),
    });
  } catch (error) {
    throw new ApiError(400, "Email Verification Confirmation email not sent");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User is verified Successfully"));
});
const resendverificationemail = asyncHandler(async (req, res) => {
  // get token from req.params
  const { email } = req.body;

  // find user by token
  const userToVerify = await User.findOne({ email });
  // if user do not exist send error
  if (!userToVerify) {
    throw new ApiError(404, "User not found. Please register your account ");
  }
  // Check if the User is verified
  if (userToVerify.isVerified) {
    throw new ApiError(400, "User is Already verified");
  }

  // if user exist create the tokens
  const { token, hashedToken, tokenExpiry } =
    await userToVerify.generateTempToken();
  // save in db
  userToVerify.verificationToken = hashedToken;
  userToVerify.verificationTokenExpiry = tokenExpiry;
  const name = userToVerify.name;
  // save the user
  await userToVerify.save();
  // send email to User
  const verificationURL = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;
  try {
    await sendMail({
      email: userToVerify.email,
      subject: "User Resend Verification Email",
      mailGenContent: emailVerificationContent(name, verificationURL),
    });
  } catch (err) {
    throw new ApiError(400, "Email Verification failed", err);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "User verification Email Sent Successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  // get email and password from the req.body
  const { email, password } = req.body;
  // find user by email
  const loggedinUser = await User.findOne({ email });
  // if no then send err
  if (!loggedinUser) {
    throw new ApiError(404, "Email or Password is incorrect");
  }
  // if yes then matches given password with User's password
  const isValid = await loggedinUser.isPasswordCorrect(password);
  //if no then send err
  if (!isValid) {
    throw new ApiError(404, "Email or Password is incorrect");
  }
  //if yes then generate Access and refresh token
  const accessToken = loggedinUser.generateAccessToken();
  const refreshToken = loggedinUser.generateRefreshToken();
  loggedinUser.isLoggedIn = true;
  //save access token in cookies
  const accessTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 1 day
  };

  res.cookie("AccessToken", accessToken, accessTokenCookieOptions);

  //save refresh token in cookies
  const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 20 * 60 * 1000, // 1 hour
  };

  res.cookie("RefreshToken", refreshToken, refreshTokenCookieOptions);
  //save refresh token in database
  loggedinUser.refreshToken = refreshToken;

  // save the user
  await loggedinUser.save();
  res.status(200).json(new ApiResponse(200, " User is logged In"));
});
const getProfile = asyncHandler(async (req, res) => {
  const loggedinUser = await User.findById(req.user.id);
  if (!loggedinUser) {
    throw new ApiError(404, "User is logged Out");
  }
  return res.status(200).json(new ApiResponse(200, "You are on Profile Page "));
});
const logOut = asyncHandler(async (req, res) => {
  //  find the user by id
  console.log("Request reacher logOut");
  const loggedinUser = await User.findById(req.user.id);
  console.log(loggedinUser);
  // if user not found throw error
  if (!loggedinUser) {
    throw new ApiError(404, "User not found");
  }
  // if find then delete the cookies
  const accessTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  res.clearCookie("AccessToken", accessTokenCookieOptions);
  const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  res.clearCookie("RefreshToken", refreshTokenCookieOptions);

  // delete the refresh token from db
  loggedinUser.refreshToken = undefined;
  // save the user
  loggedinUser.save();
  return res.status(200).json(new ApiResponse(200, "User is loggedOut"));
});
const forgotPass = asyncHandler(async (req, res) => {
  // get email from req.body
  const { email } = req.body;
  // find user by email
  const user = await User.findOne({ email });
  // if user not exist throw error
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const name = user.name;
  // if exist generate tokens
  const { token, hashedToken, tokenExpiry } = await user.generateTempToken();
  // save in db
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save();
  // send email
  console.log(token);
  const resetPassUrl = `${process.env.BASE_URL}/api/v1/users/forgotPass/${token}`;
  await sendMail({
    email: user.email,
    subject: " Reset Password Email",
    mailGenContent: resetPasswordEmailContent(name, resetPassUrl),
  });
  res.status(200).json(new ApiResponse(200, "Email send Successfully"));
});
const resetPass = asyncHandler(async (req, res) => {
  // get token from req.params
  const { token } = req.params;
  // get password,confirm Password from req.body
  const { password, confirmPassword } = req.body;
  if (!token) {
    throw new ApiError(404, "Token not found");
  }
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const resetPassUser = await User.findOne({
    forgotPasswordToken: hashedToken,
    // forgotPasswordExpiry: { $gt: Date.now() },
  });
  if (!resetPassUser) {
    throw new ApiError(404, "User not found");
  }
  resetPassUser.forgotPasswordToken = undefined;
  resetPassUser.forgotPasswordExpiry = undefined;
  resetPassUser.password = password;
  await resetPassUser.save();
  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed Successfully"));
});
const resetCurrentPass = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const loggedinUser = await User.findById(req.user.id);
  if (!loggedinUser) {
    throw new ApiError(404, "User not found");
  }
  loggedinUser.password = password;
  await loggedinUser.save();
  return res
    .status(200)
    .json(new ApiResponse(200, "Password Changed Successfully"));
});
export {
  userRegister,
  verifyUser,
  resendverificationemail,
  loginUser,
  logOut,
  getProfile,
  forgotPass,
  resetPass,
  resetCurrentPass,
};
