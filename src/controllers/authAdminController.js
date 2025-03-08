const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient"); // Ensure you have the Prisma client set up
const translate = require("translate-google"); // Assuming you are using this for translations
const { sendConfirmationEmail } = require("../utils/email");
const { generateVerificationCode } = require("../utils/helpers");
const generateAccessToken = (user) =>
  jwt.sign(user, process.env.ACCESS_SECRET_ADMIN, { expiresIn: "1h" });
const generateRefreshToken = (user) =>
  jwt.sign(user, process.env.REFRESH_SECRET_ADMIN, { expiresIn: "7d" });

const register = async (req, res) => {
  const lang = req.query.lang || "ar";

  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      const message = await translate(
        "name, password, email  phone  role are required",
        { to: lang }
      );
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }

    const existingUser = await prisma.employee.findFirst({
      where: {
        OR: [{ email: email || undefined }, { phone: phone || undefined }],
      },
    });

    if (existingUser) {
      const message = await translate("Email or phone already in use", {
        to: lang,
      });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    if (role !== "admin") {
      const message = await translate("Only admin can register", { to: lang });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    if (role === "admin") {
      const verificationCode = generateVerificationCode();
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.employee.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          verificationCode,
          role,
          permissions: {
            create: {
              viewOrders: true,
              updateOrders: true,
              deleteOrders: true,
              viewCustomers: true,
              updateCustomers: true,
              viewServices: true,
              createServices: true,
              updateServices: true,
              deleteServices: true,
              viewOffers: true,
              createOffers: true,
              updateOffers: true,
              deleteOffers: true,
              viewCategories: true,
              createCategories: true,
              updateCategories: true,
              deleteCategories: true,
              viewStores: true,
              createStores: true,
              updateStores: true,
              deleteStores: true,
              viewProviders: true,
              approveProviders: true,
              updateProviders: true,
              deleteProviders: true,
              viewWallets: true,
              manageTransactions: true,
              viewBasicReports: true,
              viewAdvancedReports: true,
              exportReports: true,
              viewEmployees: true,
              createEmployees: true,
              updateEmployees: true,
              deleteEmployees: true,
              managePermissions: true,
              manageSettings: true,
              viewAuditLogs: true,
              manageBackups: true,
            },
          },
        },
      });

      if (email) {
        await sendConfirmationEmail(email, verificationCode);
      }

      const message = await translate(
        "Registration successful. Verification code sent.",
        { to: lang }
      );
      const refreshToken = generateRefreshToken(newUser);
      const accessToken = generateAccessToken(newUser);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: newUser,
        accessToken,
        refreshToken
      });
      return;
    }
    const verificationCode = generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        verificationCode,
        role,
      },
    });

    if (email) {
      await sendConfirmationEmail(email, verificationCode);
    }

    const message = await translate(
      "Registration successful. Verification code sent.",
      { to: lang }
    );
    const refreshToken = generateRefreshToken(newUser);
    const accessToken = generateAccessToken(newUser);
    if (lang === "en") {
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      res.status(201).json({
        status: true,
        message,
        code: 201,
        data: newUser,
        accessToken,
        refreshToken,
      });
      return;
    }
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    res.status(201).json({
      status: true,
      message,
      code: 201,
      data: {
        ...newUser,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, {
      to: lang,
    });
    console.error("❌ Error during registration:", error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

// Login
const login = async (req, res) => {
  const lang = req.query.lang || "en";
  try {
    // التحقق من وجود إما البريد الإلكتروني أو رقم الهاتف
    const { email, password, phone, role, isActive } = req.body;
    let whereCondition;
    if (email) {
      whereCondition = { email };
    } else if (phone) {
      whereCondition = { phone };
    }

    // إضافة الدور إلى شروط البحث
    whereCondition.role = role;

    if ((!email && !phone) || !password || !role) {
      const message = await translate(
        "Email or phone and password and role are required",
        { to: lang }
      );
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    const employee = await prisma.employee.findUnique({
      where: whereCondition,
      include: {
        permissions: true,
      },
    });

    if (!employee) {
      const message = await translate(
        "Invalid email or phone or password or role",
        { to: lang }
      );
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    const passwordMatch = isActive
      ? password === employee.password
      : await bcrypt.compare(password, employee.password);
    if (!passwordMatch) {
      const message = await translate(
        "Invalid email or phone or password or role",
        { to: lang }
      );
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }
    if (!employee.isActive) {
      let verificationCode = generateVerificationCode();
      let employee2 = await prisma.employee.update({
        where: { id: employee.id },
        data: { verificationCode },
      });
      const refreshToken = generateRefreshToken(employee2);
      const accessToken = generateAccessToken(employee2);
      // await sendConfirmationEmail(user.email, verificationCode);
      const message = await translate("Account not verified", { to: lang });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      return res.status(200).json({
        status: false,
        message,
        code: 200,
        data: employee2,
        accessToken,
        refreshToken,
      });
    }
    const refreshToken2 = generateRefreshToken(employee);
    const accessToken2 = generateAccessToken(employee);
    let message = await translate("Login successful", { to: lang });
    if (lang === "en") {
      res.cookie("refreshToken", refreshToken2, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });
      res.status(200).json({
        status: true,
        message,
        code: 200,
        data: employee,
        accessToken: accessToken2,
        refreshToken: refreshToken2,
      });
      return;
    }
    res.cookie("refreshToken", refreshToken2, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: {
        ...employee,
      },
      accessToken: accessToken2,
      refreshToken: refreshToken2,
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, {
      to: lang,
    });
    console.error("❌ Error during login:", error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  const lang = req.query.lang || "en";
  try {
    const { adminId, oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      const message = await translate(
        "Old password and new password are required",
        { to: lang }
      );
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    const user = await prisma.employee.findUnique({ where: { id: adminId } });

    if (!user || user.password !== oldPassword) {
      const message = await translate("Invalid old password", { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    await prisma.employee.update({
      where: { id: adminId },
      data: { password: newPassword },
    });

    const message = await translate("Password updated successfully", {
      to: lang,
    });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null,
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, {
      to: lang,
    });
    console.error("❌ Error changing password:", error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};
const resendVerificationCode = async (req, res) => {
  const lang = req.query.lang || "en";
  try {
    const { id } = req.body;

    if (!id) {
      const message = await translate("Id is required", { to: lang });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    const user = await prisma.employee.findUnique({ where: { id } });

    if (!user) {
      const message = await translate("User not found", { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null,
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();

    // Update user with new code
    await prisma.employee.update({
      where: { id },
      data: { verificationCode },
    });

    // Send verification email
    await sendConfirmationEmail(user.email, verificationCode);

    const message = await translate("Verification code resent successfully", {
      to: lang,
    });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: null,
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, {
      to: lang,
    });
    console.error("❌ Error resending verification code:", error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};
const verifyAccount = async (req, res) => {
  const lang = req.query.lang || "en";
  try {
    const { id, verificationCode } = req.body;

    if (!id || !verificationCode) {
      const message = await translate("Id and verification code are required", {
        to: lang,
      });
      return res.status(401).json({
        status: false,
        message,
        code: 401,
        data: null,
      });
    }

    const user = await prisma.employee.findUnique({ where: { id } });

    if (!user) {
      const message = await translate("User not found", { to: lang });
      return res.status(404).json({
        status: false,
        message,
        code: 404,
        data: null,
      });
    }

    if (+user.verificationCode !== +verificationCode) {
      const message = await translate("Invalid verification code", {
        to: lang,
      });
      return res.status(400).json({
        status: false,
        message,
        code: 400,
        data: null,
      });
    }

    let employee2 = await prisma.employee.update({
      where: { id },
      data: { isActive: true },
    });

    const message = await translate("Account verified successfully", {
      to: lang,
    });
    res.status(200).json({
      status: true,
      message,
      code: 200,
      data: employee2,
    });
  } catch (error) {
    const message = await translate(`Internal server error: ${error.message}`, {
      to: lang,
    });
    console.error("❌ Error verifying account:", error);
    res.status(500).json({
      status: false,
      message,
      code: 500,
      data: null,
    });
  }
};

// تجديد التوكن
const refresh = async (req, res) => {
  const lang = req.query.lang || "en";
  const refreshToken = req.cookies.refreshToken;
  let message = await translate("Unauthorized", { to: lang });
  if (!refreshToken)
    return res.status(401).json({
      status: false,
      message,
      code: 401,
      data: null,
    });

  let messageError = await translate("Forbidden", { to: lang });
  let messageSuccess = await translate("Token refreshed successfully", {
    to: lang,
  });
  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: false,
        message: messageError,
        code: 403,
        data: null,
      });
    }

    const newAccessToken = generateAccessToken({
      id: user.id,
      username: user.username,
    });
    res.json({
      status: true,
      message: messageSuccess,
      code: 200,
      accessToken: newAccessToken,
      refreshToken,
    });
  });
};

module.exports = {
  register,
  login,
  changePassword,
  resendVerificationCode,
  verifyAccount,
  refresh,
};
