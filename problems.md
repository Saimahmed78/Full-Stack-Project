when i am registering the user even though the verifications tokens are not being generated , the user is being registered successfully .
the code of register user controller is 
const userRegister = asyncHandler(async (req, res) => {
  // get email and password from the user
  const { name, email, password } = req.body;

  // then find the user by email
  const existingUser = await User.findOne({ email });
  // if user exist then send error
  if (existingUser)
    throw new ApiError(404, "Validation failed", ["User already exist"]);

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
  console.log(`Token=${token}`);
  // save user
  newUser.save();
  //send Mail
  console.log(newUser);
  const verificationURL = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;
  try {
    await sendMail({
      email: newUser.email,
      subject: "User Verification Email",
      mailGenContent: emailVerificationContent(name, verificationURL),
    });
  } catch (err) {
    if (err) throw new ApiError(400, "Email Verification failed");
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
and to generate tokens i have added method to generate tokens 
userSchema.methods.generateTempToken = function () {
  const token = crypto.randomBytes(62).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const tokenExpiry = Date.now().toLocaleString();

  return { token, hashedToken, tokenExpiry };
};

So i solved the error by putting a validation this will not allow the user to save without tokens
  if (!newUser.verificationToken && !newUser.verificationTokenExpiry) {
    throw new ApiError(400, "User registration is failed", [
      "Verification token failed",
      "Verifcation Token expiry failed",
    ]);
  }
  //if yes,  save user
  await newUser.save();

2. I shut down the server in vscode but when i was sneding request on postman it was not showing an error or response

SO i did saimahmed@pop-os:~$ lsof -i :4000
COMMAND   PID      USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    15801 saimahmed   25u  IPv6  83345      0t0  TCP *:4000 (LISTEN)
postman 19217 saimahmed  147u  IPv4  97845      0t0  TCP localhost:58538->localhost:4000 (ESTABLISHED)
postman 19217 saimahmed  155u  IPv4  99135      0t0  TCP localhost:57992->localhost:4000 (ESTABLISHED)
 in terminal then to kill the process
 saimahmed@pop-os:~$ kill -9 15801

check if once account is verifed than if resend email failed
check if once account verification is failed then resend verification works