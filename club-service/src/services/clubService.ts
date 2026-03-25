import { Club } from '../models/Club';
import { Membership, MemberRole } from '../models/Membership';
import { ClubHabit } from '../models/ClubHabit';
import { AcceptedHabit } from '../models/AcceptedHabit';
import { ActivityLog } from '../models/ActivityLog';
import axios from 'axios';

const HABIT_SERVICE_URL = process.env.HABIT_SERVICE_URL as string;

/**
 * Generate a random alphanumeric invite code
 */
function generateInviteCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create a new club
 */
export async function createClub(
    ownerId: string,
    username: string,
    data: { name: string; description: string; category?: string; isPublic?: boolean }
) {
    const isPublic = data.isPublic !== false; // default true
    const inviteCode = isPublic ? undefined : generateInviteCode();

    // Create club
    const club = await Club.create({
        name: data.name,
        description: data.description,
        ownerId,
        category: data.category || 'OTHER',
        isPublic,
        inviteCode,
        memberCount: 1
    });

    // Create owner membership
    await Membership.create({
        clubId: club._id.toString(),
        userId: ownerId,
        username,
        role: MemberRole.OWNER
    });

    // Log activity
    await ActivityLog.create({
        clubId: club._id.toString(),
        userId: ownerId,
        username,
        action: 'JOINED',
        timestamp: new Date()
    });

    return club;
}

/**
 * Get all public clubs
 */
export async function getPublicClubs() {
    return Club.find({ isPublic: true }).sort({ memberCount: -1, createdAt: -1 });
}

/**
 * Get user's clubs (clubs the user is a member of)
 */
export async function getUserClubs(userId: string) {
    const memberships = await Membership.find({ userId });
    const clubIds = memberships.map(m => m.clubId);

    const clubs = await Club.find({ _id: { $in: clubIds } });

    return clubs.map(club => {
        const membership = memberships.find(m => m.clubId === club._id.toString());
        return {
            ...club.toObject(),
            role: membership?.role
        };
    });
}

/**
 * Get club details
 */
export async function getClubDetails(clubId: string) {
    const club = await Club.findById(clubId);
    if (!club) {
        throw new Error('Club not found');
    }
    return club;
}

/**
 * Join a club
 */
export async function joinClub(clubId: string, userId: string, username: string, inviteCode?: string) {
    const club = await Club.findById(clubId);
    if (!club) {
        throw new Error('Club not found');
    }

    // For private clubs, validate invite code
    if (!club.isPublic) {
        if (!inviteCode || inviteCode.toUpperCase() !== club.inviteCode) {
            throw new Error('Invalid invite code');
        }
    }

    // Check if already a member
    const existing = await Membership.findOne({ clubId, userId });
    if (existing) {
        throw new Error('Already a member of this club');
    }

    // Create membership
    await Membership.create({
        clubId,
        userId,
        username,
        role: MemberRole.MEMBER
    });

    // Update member count
    await Club.findByIdAndUpdate(clubId, { $inc: { memberCount: 1 } });

    // Log activity
    await ActivityLog.create({
        clubId,
        userId,
        username,
        action: 'JOINED',
        timestamp: new Date()
    });

    return club;
}

/**
 * Join a private club by invite code alone (without knowing the club ID)
 */
export async function joinClubByCode(inviteCode: string, userId: string, username: string) {
    // Find club by invite code
    const club = await Club.findOne({ inviteCode: inviteCode.toUpperCase(), isPublic: false });
    if (!club) {
        throw new Error('Invalid invite code. Please check the code and try again.');
    }
    // Delegate to existing joinClub with the code (which validates and adds membership)
    return joinClub(club._id.toString(), userId, username, inviteCode);
}

/**
 * Leave a club
 */
export async function leaveClub(clubId: string, userId: string, username: string) {
    const membership = await Membership.findOne({ clubId, userId });
    if (!membership) {
        throw new Error('Not a member of this club');
    }

    if (membership.role === MemberRole.OWNER) {
        throw new Error('Owner cannot leave the club. Transfer ownership or delete the club.');
    }

    // Remove membership
    await Membership.deleteOne({ clubId, userId });

    // Update member count
    await Club.findByIdAndUpdate(clubId, { $inc: { memberCount: -1 } });

    // Log activity
    await ActivityLog.create({
        clubId,
        userId,
        username,
        action: 'LEFT',
        timestamp: new Date()
    });
}

/**
 * Get club members
 */
export async function getClubMembers(clubId: string) {
    return Membership.find({ clubId }).sort({ joinedAt: -1 });
}

/**
 * Add habit to club
 */
export async function addClubHabit(clubId: string, userId: string, habitData: any) {
    // Verify user is owner or admin
    const membership = await Membership.findOne({ clubId, userId });
    if (!membership || (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)) {
        throw new Error('Only club owners and admins can add habits');
    }

    const clubHabit = await ClubHabit.create({
        clubId,
        ...habitData,
        createdBy: userId
    });

    return clubHabit;
}

/**
 * Delete a club habit
 */
export async function deleteClubHabit(clubId: string, habitId: string, userId: string) {
    const membership = await Membership.findOne({ clubId, userId });
    if (!membership || (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)) {
        throw new Error('Only club owners and admins can delete habits');
    }

    const clubHabit = await ClubHabit.findById(habitId);
    if (!clubHabit || clubHabit.clubId !== clubId) {
        throw new Error('Club habit not found');
    }

    await ClubHabit.deleteOne({ _id: habitId });
    return { deleted: true };
}

/**
 * Get invite code for a private club (owner/admin only)
 */
export async function getClubInviteCode(clubId: string, userId: string) {
    const membership = await Membership.findOne({ clubId, userId });
    if (!membership || (membership.role !== MemberRole.OWNER && membership.role !== MemberRole.ADMIN)) {
        throw new Error('Only club owners and admins can view the invite code');
    }
    const club = await Club.findById(clubId);
    if (!club) throw new Error('Club not found');
    if (club.isPublic) throw new Error('Public clubs do not have invite codes');
    return club.inviteCode;
}

/**
 * Get club habits
 */
export async function getClubHabits(clubId: string) {
    return ClubHabit.find({ clubId }).sort({ createdAt: -1 });
}

/**
 * Accept a club habit (creates habit in habit-service and links it)
 */
export async function acceptClubHabit(clubId: string, clubHabitId: string, userId: string, username: string, token: string) {
    const clubHabit = await ClubHabit.findById(clubHabitId);
    if (!clubHabit || clubHabit.clubId !== clubId) {
        throw new Error('Club habit not found');
    }

    // Check if already accepted
    const existing = await AcceptedHabit.findOne({ clubHabitId, userId });
    if (existing) {
        throw new Error('Already accepted this habit');
    }

    // Create habit in habit-service
    try {
        const response = await axios.post(
            `${HABIT_SERVICE_URL}/api/habits`,
            {
                name: clubHabit.name,
                description: `[Club: ${clubId}] ${clubHabit.description}`,
                category: clubHabit.category,
                difficulty: clubHabit.difficulty,
                frequency: clubHabit.frequency,
                ...(clubHabit.frequency === 'CUSTOM' && clubHabit.targetDays?.length
                    ? { targetDays: clubHabit.targetDays }
                    : {})
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const userHabitId = response.data.data._id;

        // Create accepted habit record
        await AcceptedHabit.create({
            clubId,
            clubHabitId,
            userId,
            userHabitId
        });

        // Log activity
        await ActivityLog.create({
            clubId,
            userId,
            username,
            habitName: clubHabit.name,
            action: 'ACCEPTED_TASK',
            timestamp: new Date()
        });

        return { clubHabit, userHabitId };
    } catch (error: any) {
        throw new Error(`Failed to create habit: ${error.message}`);
    }
}

/**
 * Get user's accepted habits in a club
 */
export async function getUserAcceptedHabits(clubId: string, userId: string) {
    const accepted = await AcceptedHabit.find({ clubId, userId });
    const clubHabitIds = accepted.map(a => a.clubHabitId);
    const clubHabits = await ClubHabit.find({ _id: { $in: clubHabitIds } });

    return accepted.map(a => {
        const clubHabit = clubHabits.find(h => h._id.toString() === a.clubHabitId);
        return {
            ...a.toObject(),
            clubHabit: clubHabit?.toObject()
        };
    });
}

/**
 * Log a club habit completion (auto-accepts if not already done)
 */
export async function logClubHabit(clubId: string, clubHabitId: string, userId: string, username: string, token: string) {
    // Verify the user is a club member
    const membership = await Membership.findOne({ clubId, userId });
    if (!membership) {
        throw new Error('Not a member of this club');
    }

    const clubHabit = await ClubHabit.findById(clubHabitId);
    if (!clubHabit || clubHabit.clubId !== clubId) {
        throw new Error('Club habit not found');
    }

    // Find or auto-create the personal habit for this user
    let accepted = await AcceptedHabit.findOne({ clubHabitId, userId });
    let userHabitId: string;

    if (!accepted) {
        // Auto-accept: create a personal habit copy in the habit-service
        // Valid habit-service categories: HEALTH, PRODUCTIVITY, LEARNING, SOCIAL, FINANCE, MINDFULNESS, OTHER
        const VALID_CATEGORIES = ['HEALTH', 'PRODUCTIVITY', 'LEARNING', 'SOCIAL', 'FINANCE', 'MINDFULNESS', 'OTHER'];
        const CATEGORY_MAP: Record<string, string> = {
            'FITNESS': 'HEALTH',
            'EXERCISE': 'HEALTH',
            'WELLNESS': 'HEALTH',
            'WORK': 'PRODUCTIVITY',
            'STUDY': 'LEARNING',
            'EDUCATION': 'LEARNING',
            'COMMUNITY': 'SOCIAL',
            'RELATIONSHIPS': 'SOCIAL',
            'MONEY': 'FINANCE',
            'MEDITATION': 'MINDFULNESS',
            'MENTAL': 'MINDFULNESS',
        };
        const rawCategory = (clubHabit.category || '').toUpperCase();
        const normalizedCategory = VALID_CATEGORIES.includes(rawCategory)
            ? rawCategory
            : (CATEGORY_MAP[rawCategory] || 'OTHER');

        try {
            const response = await axios.post(
                `${HABIT_SERVICE_URL}/api/habits`,
                {
                    name: clubHabit.name,
                    description: `[Club] ${clubHabit.description || ''}`.trim(),
                    category: normalizedCategory,
                    difficulty: (clubHabit.difficulty >= 1 && clubHabit.difficulty <= 5)
                        ? clubHabit.difficulty
                        : 2,
                    frequency: ['DAILY', 'WEEKLY', 'CUSTOM'].includes(clubHabit.frequency)
                        ? clubHabit.frequency
                        : 'DAILY',
                    ...(clubHabit.frequency === 'CUSTOM' && clubHabit.targetDays?.length
                        ? { targetDays: clubHabit.targetDays }
                        : {})
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            userHabitId = response.data.data._id;

            accepted = await AcceptedHabit.create({
                clubId,
                clubHabitId,
                userId,
                userHabitId
            });

            // Log ACCEPTED_TASK activity
            await ActivityLog.create({
                clubId,
                userId,
                username,
                habitName: clubHabit.name,
                action: 'ACCEPTED_TASK',
                timestamp: new Date()
            });
        } catch (error: any) {
            throw new Error(`Failed to auto-create habit: ${error.message}`);
        }
    } else {
        userHabitId = accepted.userHabitId;
    }

    // Log the completion via habit-service
    try {
        const logResponse = await axios.post(
            `${HABIT_SERVICE_URL}/api/habits/${userHabitId}/log`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Log HABIT_COMPLETED activity
        await ActivityLog.create({
            clubId,
            userId,
            username,
            habitName: clubHabit.name,
            action: 'COMPLETED_HABIT',
            timestamp: new Date()
        });

        return {
            clubHabitId,
            userHabitId,
            xpEarned: logResponse.data.data?.xpEarned || logResponse.data.xpEarned || 0
        };
    } catch (error: any) {
        const msg = error?.response?.data?.message || error.message;
        throw new Error(msg || 'Failed to log habit completion');
    }
}

/**
 * Handle account deletion: transfer ownership or delete clubs
 * Called by user-service when a user deletes their account.
 */
export async function handleUserDeleted(userId: string): Promise<void> {
    // ── Step 1: Handle clubs this user OWNS ──────────────────────────────────
    const ownedClubs = await Club.find({ ownerId: userId });

    for (const club of ownedClubs) {
        const clubId = club._id.toString();

        // Find other members sorted by joinedAt ascending (earliest joiner = next owner)
        const otherMembers = await Membership.find({
            clubId,
            userId: { $ne: userId }
        }).sort({ joinedAt: 1 });

        if (otherMembers.length > 0) {
            // ── Transfer ownership ────────────────────────────────────────────
            const newOwner = otherMembers[0];

            // Promote new owner
            await Membership.updateOne(
                { _id: newOwner._id },
                { $set: { role: MemberRole.OWNER } }
            );

            // Update club's ownerId
            await Club.findByIdAndUpdate(clubId, {
                $set: { ownerId: newOwner.userId },
                $inc: { memberCount: -1 }   // decrement for the departing owner
            });

            // Remove the deleted user's membership record so they vanish from member lists
            await Membership.deleteOne({ clubId, userId });

            // Log the ownership transfer
            await ActivityLog.create({
                clubId,
                userId: newOwner.userId,
                username: newOwner.username,
                action: 'JOINED',
                timestamp: new Date()
            });
        } else {
            // ── No other members — nuke the club and everything in it ─────────
            const { AcceptedHabit } = await import('../models/AcceptedHabit');
            await Promise.all([
                ClubHabit.deleteMany({ clubId }),
                Membership.deleteMany({ clubId }),
                ActivityLog.deleteMany({ clubId }),
                AcceptedHabit.deleteMany({ clubId }),
            ]);
            await Club.findByIdAndDelete(clubId);
        }
    }

    // ── Step 2: Remove the user from any clubs they were a non-owner member of ─
    const nonOwnerMemberships = await Membership.find({ userId, role: { $ne: MemberRole.OWNER } });
    for (const m of nonOwnerMemberships) {
        await Membership.deleteOne({ _id: m._id });
        await Club.findByIdAndUpdate(m.clubId, { $inc: { memberCount: -1 } });
    }
}


/**
 * Delete a club (owner only)
 */
export async function deleteClub(clubId: string, userId: string): Promise<void> {
    const club = await Club.findById(clubId);
    if (!club) {
        throw new Error('Club not found');
    }

    // Verify requester is the owner
    const membership = await Membership.findOne({ clubId, userId });
    if (!membership || membership.role !== MemberRole.OWNER) {
        throw new Error('Only the club owner can delete this club');
    }

    // Delete all related data
    await ClubHabit.deleteMany({ clubId });
    await Membership.deleteMany({ clubId });
    await ActivityLog.deleteMany({ clubId });
    const { AcceptedHabit } = await import('../models/AcceptedHabit');
    await AcceptedHabit.deleteMany({ clubId });
    await Club.findByIdAndDelete(clubId);
}
