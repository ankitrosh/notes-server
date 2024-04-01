import { RequestHandler } from "express";
import createHttpError from "http-errors";
import Users from "../models/user";
import bcrypt from "bcrypt";

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await Users?.findById(req.session.userId)
      .select("+email")
      .exec();
    res.status(200).json({
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
interface SignUpBody {
  username?: string;
  email?: string;
  password?: string;
}
export const signUp: RequestHandler<
  unknown,
  unknown,
  SignUpBody,
  unknown
> = async (req, res, next) => {
  const { username, email, password: passwordRaw } = req.body;

  try {
    if (!username || !email || !passwordRaw) {
      throw createHttpError(400, "Parameters missing");
    }

    const existingUsername = await Users.findOne({ username: username }).exec();
    if (existingUsername) {
      throw createHttpError(
        409,
        "Username already taken, Please choose a different name"
      );
    }

    const existingEmail = await Users.findOne({ email: email }).exec();

    if (existingEmail) {
      throw createHttpError(
        409,
        "Email already taken, Please choose a different email"
      );
    }
    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await Users.create({
      username: username,
      email: email,
      password: passwordHashed,
    });

    req.session.userId = newUser._id;

    res.status(201).json({
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

interface LoginBody {
  email?: string;
  password?: string;
}

export const login: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw createHttpError(400, "Parameters missing");
    }

    const user = await Users.findOne({ email: email })
      .select("+email +password")
      .exec();
    if (!user) {
      throw createHttpError(401, "Invalid Credentials");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw createHttpError(401, "Invalid Credentials");
    }

    req.session.userId = user._id;

    res.status(201).json({
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(200);
    }
  });
};
