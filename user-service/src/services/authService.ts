import bcrypt from 'bcryptjs';
import { User, IUser, BehavioralMode } from '../models/User';
import { Session } from '../models/Session';

const SALT_ROUNDS = 10;

export interface RegisterData {
    email: string;
    username: string;
    password: string;
    mode?: BehavioralMode;
}

export interface LoginData {
    email?: string;
    username?: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        username: string;
        mode: BehavioralMode;
        xp: number;
        level: number;
    };
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: data.email }, { username: data.username }]
    });

    if (existingUser) {
        if (existingUser.email === data.email) {
            throw new Error('Email already registered');
        }
        throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = new User({
        email: data.email,
        username: data.username,
        passwordHash,
        mode: data.mode || BehavioralMode.BALANCED,
        xp: 0,
        level: 1
    });

    await user.save();
    return user;
}

/**
 * Login user and create session
 */
export async function loginUser(
    data: LoginData,
    generateTokens: (userId: string, email: string, mode: string) => { accessToken: string; refreshToken: string }
): Promise<AuthTokens> {
    // Find user by email or username
    const query = data.email
        ? { email: data.email }
        : { username: data.username };

    const user = await User.findOne(query);
    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
        user._id.toString(),
        user.email,
        user.mode
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await Session.create({
        userId: user._id.toString(),
        accessToken,
        refreshToken,
        expiresAt
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            mode: user.mode,
            xp: user.xp,
            level: user.level
        }
    };
}

/**
 * Logout user by invalidating session
 */
export async function logoutUser(refreshToken: string): Promise<void> {
    await Session.deleteOne({ refreshToken });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
    userId: string,
    updates: { username?: string; mode?: BehavioralMode }
): Promise<IUser | null> {
    // If username is being updated, check if it's available
    if (updates.username) {
        const existingUser = await User.findOne({
            username: updates.username,
            _id: { $ne: userId }
        });
        if (existingUser) {
            throw new Error('Username already taken');
        }
    }

    return User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
    );
}

/**
 * Update user XP and level
 */
export async function updateUserXP(
    userId: string,
    xpToAdd: number,
    newLevel: number
): Promise<IUser | null> {
    return User.findByIdAndUpdate(
        userId,
        {
            $inc: { xp: xpToAdd },
            $set: { level: newLevel }
        },
        { new: true }
    );
}
