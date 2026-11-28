import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "../middleware/asyncHandler.js";
import { createHttpError } from "../middleware/errors.js";
import { getJwtSecret } from "../middleware/requireAuth.js";
import User from "../models/User.js";

const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES_IN = "2h";

function toPublicUser(user) {
  return {
    _id: user._id,
    id: String(user._id),
    name: user.name,
    email: user.email,
  };
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      name: user.name,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export const register = asyncHandler(async (request, response, next) => {
  const { name, email, password } = request.validatedAuth;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(
      createHttpError(409, "An account with this email already exists."),
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const token = issueToken(user);
  return response.status(201).json({
    token,
    user: toPublicUser(user),
  });
});

export const login = asyncHandler(async (request, response, next) => {
  const { email, password } = request.validatedAuth;

  const user = await User.findOne({ email });
  if (!user) {
    return next(createHttpError(401, "Invalid email or password."));
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return next(createHttpError(401, "Invalid email or password."));
  }

  const token = issueToken(user);
  return response.json({
    token,
    user: toPublicUser(user),
  });
});

export const getCurrentUser = asyncHandler(async (request, response, next) => {
  const user = await User.findById(request.user.id);
  if (!user) {
    return next(createHttpError(401, "Invalid or expired token."));
  }
  return response.json({ user: toPublicUser(user) });
});
