import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BASE_REUSABLE_SLOTS,
  BASE_SINGLE_USE_CREDITS,
  generateReferralCode,
  newId,
  slotBalance,
  type SlotBalance,
} from '@vastra/shared';
import { slotGrants, users, type Database } from '@vastra/db';
import { and, eq, isNull } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { VerifiedUser } from '../auth/firebase-token';

export interface UserProfile {
  id: string;
  handle: string;
  email: string | null;
  referralCode: string;
  createdAt: Date;
  spaces: SlotBalance;
}

/** Postgres unique-violation. Retried rather than pre-checked: a SELECT-then-
 *  INSERT race is exactly how two users end up sharing a referral code. */
const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === UNIQUE_VIOLATION;
}

/**
 * Turns a handle candidate into something safe and recognisable. Falls back to
 * a generic stem rather than an empty string when someone's email local part is
 * entirely punctuation or non-Latin.
 */
function handleFrom(email: string | null): string {
  const stem = (email?.split('@')[0] ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 18);
  return stem.length >= 3 ? stem : 'vastra';
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * Finds the row for a verified caller, creating it on first sight.
   *
   * There is no separate "sign up" call. The first authenticated request from a
   * new uid provisions the account, which removes the whole class of bug where
   * a client crashes between signing in and registering and leaves a user with
   * a valid token and no row.
   */
  async provision(verified: VerifiedUser): Promise<UserProfile> {
    const existing = await this.findByFirebaseUid(verified.uid);
    if (existing) return existing;

    // Referral codes collide by birthday, not by bug. Retry on the unique index
    // rather than checking first — a check-then-insert is racy under concurrency.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = newId();
      const referralCode = generateReferralCode();
      const handle = `${handleFrom(verified.email)}${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`;

      try {
        const created = await this.db.transaction(async (tx) => {
          const [row] = await tx
            .insert(users)
            .values({
              id,
              firebaseUid: verified.uid,
              handle,
              referralCode,
              // Firebase Google sign-in carries no phone number, so F1 ("one
              // account per number", §4) cannot be enforced for these accounts.
              // Left null deliberately rather than filled with a placeholder,
              // which would make the partial unique index meaningless.
              phoneHash: null,
              reusableSlots: BASE_REUSABLE_SLOTS,
              singleUseGranted: BASE_SINGLE_USE_CREDITS,
              singleUseSpent: 0,
            })
            .returning();

          // The audit trail starts at the first row, not at the first purchase.
          // "Why do I have one permanent space" must be answerable from grants.
          await tx.insert(slotGrants).values([
            {
              id: newId(),
              userId: id,
              kind: 'reusable',
              amount: BASE_REUSABLE_SLOTS,
              reason: 'signup',
            },
            {
              id: newId(),
              userId: id,
              kind: 'single_use',
              amount: BASE_SINGLE_USE_CREDITS,
              reason: 'signup',
            },
          ]);

          return row;
        });

        if (created) {
          this.logger.log(`provisioned user ${created.id}`);
          return this.toProfile(created, 0);
        }
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;

        // Two accounts can race on the *same* uid — a client firing several
        // requests at once on first launch. The loser must read the winner's
        // row, not keep generating new codes forever.
        const raced = await this.findByFirebaseUid(verified.uid);
        if (raced) return raced;

        this.logger.warn(`unique collision provisioning ${verified.uid}, attempt ${attempt + 1}`);
      }
    }

    throw new Error(`Could not provision a user for ${verified.uid} after 5 attempts.`);
  }

  async findByFirebaseUid(uid: string): Promise<UserProfile | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.firebaseUid, uid), isNull(users.deletedAt)))
      .limit(1);

    if (!row) return null;
    return this.toProfile(row, await this.countReusableUsed(row.id));
  }

  /** Permanent spaces currently holding an outfit. Derived from outfits rather
   *  than cached on the user, so it cannot drift out of step with reality. */
  private async countReusableUsed(_userId: string): Promise<number> {
    // Outfits are not yet served by the API (T21). Until they are, the client's
    // local store is authoritative and this is zero — stated here rather than
    // silently returning a number that looks computed.
    return 0;
  }

  private toProfile(row: typeof users.$inferSelect, reusableUsed: number): UserProfile {
    return {
      id: row.id,
      handle: row.handle,
      email: null,
      referralCode: row.referralCode,
      createdAt: row.createdAt,
      spaces: slotBalance(
        {
          reusableSlots: row.reusableSlots,
          reusableUsed,
          singleUseGranted: row.singleUseGranted,
          singleUseSpent: row.singleUseSpent,
        },
        // Entitlement comes from RevenueCat reconciliation (T29), not from this
        // table. Reported as free until that lands, which fails *closed*.
        false,
      ),
    };
  }
}
