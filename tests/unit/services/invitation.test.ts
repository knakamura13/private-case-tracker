import { beforeEach, describe, expect, it } from 'vitest';

import { baPk, entitySk, wsPk } from '$lib/server/dynamo/keys';
import { ddbGet, ddbPut } from '$lib/server/dynamo/ops';
import type { InvitationItem, MembershipItem } from '$lib/server/dynamo/types';
import { createInvitation, acceptInvitation } from '$lib/server/services/invitation.service';
import { createWorkspace } from '$lib/server/services/workspace.service';

function resetMem() {
    (globalThis as unknown as { __ddbMem?: Map<string, unknown> }).__ddbMem = new Map();
}

async function seedUser(input: { id: string; email: string; emailVerified: boolean }) {
    const now = new Date().toISOString();
    await ddbPut({
        PK: baPk('user'),
        SK: input.id,
        id: input.id,
        email: input.email,
        name: null,
        image: null,
        emailVerified: input.emailVerified,
        createdAt: now,
        updatedAt: now
    });
}

async function invite(email: string) {
    const workspace = await createWorkspace({ name: 'Matter Team', ownerUserId: 'owner-user' });
    const { invitation } = await createInvitation({
        workspaceId: workspace.id,
        email,
        role: 'COLLABORATOR',
        invitedByUserId: 'owner-user',
        inviterName: 'Owner',
        workspaceName: workspace.name
    });
    return { workspace, invitation };
}

describe('invitation.service', () => {
    beforeEach(resetMem);

    it('rejects invite acceptance when the signed-in user email does not match the invitation email', async () => {
        const { workspace, invitation } = await invite('invitee@example.com');
        await seedUser({ id: 'wrong-user', email: 'other@example.com', emailVerified: true });

        await expect(acceptInvitation(invitation.token, 'wrong-user')).rejects.toThrow('Invitation email does not match signed-in user');

        const membership = await ddbGet<MembershipItem>({
            PK: wsPk(workspace.id),
            SK: entitySk('Membership', 'wrong-user')
        });
        const storedInvite = await ddbGet<InvitationItem>({
            PK: wsPk(workspace.id),
            SK: entitySk('Invitation', invitation.id)
        });
        expect(membership).toBeUndefined();
        expect(storedInvite?.acceptedAt).toBeNull();
    });

    it('rejects invite acceptance when the signed-in user email is not verified', async () => {
        const { workspace, invitation } = await invite('invitee@example.com');
        await seedUser({ id: 'invitee-user', email: 'invitee@example.com', emailVerified: false });

        await expect(acceptInvitation(invitation.token, 'invitee-user')).rejects.toThrow('Email must be verified before accepting invitation');

        const membership = await ddbGet<MembershipItem>({
            PK: wsPk(workspace.id),
            SK: entitySk('Membership', 'invitee-user')
        });
        expect(membership).toBeUndefined();
    });

    it('accepts an invitation only for a verified user with the invited email', async () => {
        const { workspace, invitation } = await invite('invitee@example.com');
        await seedUser({ id: 'invitee-user', email: 'Invitee@Example.com', emailVerified: true });

        const membership = await acceptInvitation(invitation.token, 'invitee-user');

        expect(membership.workspaceId).toBe(workspace.id);
        expect(membership.userId).toBe('invitee-user');
        const storedInvite = await ddbGet<InvitationItem>({
            PK: wsPk(workspace.id),
            SK: entitySk('Invitation', invitation.id)
        });
        expect(storedInvite?.acceptedAt).toEqual(expect.any(String));
    });
});
