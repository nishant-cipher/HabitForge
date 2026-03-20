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
    updates: { username?: string; mode?: string; modeChangedAt?: Date }
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
 * Award or use grace cards (+1 or -1)
 */
export async function updateGraceCards(
    userId: string,
    field: 'graceSilverCards' | 'graceGoldCards',
    delta: number
): Promise<IUser | null> {
    return User.findByIdAndUpdate(
        userId,
        { $inc: { [field]: delta } },
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

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
    await User.findByIdAndDelete(userId);
    await Session.deleteMany({ userId });
}

/**
 * Change password — verifies current password first
 */
export async function updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
}

/**
 * Update email
 */
export async function updateEmail(userId: string, newEmail: string): Promise<IUser | null> {
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing && existing._id.toString() !== userId) {
        throw new Error('Email already in use');
    }
    return User.findByIdAndUpdate(userId, { $set: { email: newEmail.toLowerCase() } }, { new: true });
}

/**
 * Update notification preferences
 */
export async function updateNotificationPrefs(
    userId: string,
    prefs: { dailyReminders?: boolean; streakAlerts?: boolean; clubActivity?: boolean }
): Promise<IUser | null> {
    const update: Record<string, boolean> = {};
    if (prefs.dailyReminders !== undefined) update['notificationPrefs.dailyReminders'] = prefs.dailyReminders;
    if (prefs.streakAlerts !== undefined) update['notificationPrefs.streakAlerts'] = prefs.streakAlerts;
    if (prefs.clubActivity !== undefined) update['notificationPrefs.clubActivity'] = prefs.clubActivity;
    return User.findByIdAndUpdate(userId, { $set: update }, { new: true });
}

/**
 * Create a password reset token and store hashed copy with 1h expiry
 */
export async function createPasswordResetToken(email: string): Promise<{ rawToken: string; user: IUser }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error('No account found with that email');

    const crypto = await import('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    return { rawToken, user };
}

/**
 * Reset password using the raw token from the email link
 */
export async function resetPasswordByToken(rawToken: string, newPassword: string): Promise<void> {
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) throw new Error('Reset token is invalid or has expired');

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Invalidate all existing sessions
    await Session.deleteMany({ userId: user._id.toString() });
}

/**
 * Get all users (internal API)
 */
export async function getAllUsers(): Promise<IUser[]> {
    return User.find().select('_id email username mode xp level graceSilverCards graceGoldCards createdAt');
}

