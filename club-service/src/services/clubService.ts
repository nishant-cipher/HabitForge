import { Club } from '../models/Club';
import { Membership, MemberRole } from '../models/Membership';
import { ClubHabit } from '../models/ClubHabit';
import { AcceptedHabit } from '../models/AcceptedHabit';
import { ActivityLog } from '../models/ActivityLog';
import axios from 'axios';

const HABIT_SERVICE_URL = process.env.HABIT_SERVICE_URL || 'http://localhost:3002';

/**
 * Create a new club
 */
export async function createClub(ownerId: string, username: string, data: { name: string; description: string }) {
    // Create club
    const club = await Club.create({
        name: data.name,
        description: data.description,
        ownerId,
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
 * Get user's clubs
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
export async function joinClub(clubId: string, userId: string, username: string) {
    const club = await Club.findById(clubId);
    if (!club) {
        throw new Error('Club not found');
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
                frequency: clubHabit.frequency
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
