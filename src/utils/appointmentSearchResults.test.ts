import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeAppointmentSearchResults, mergeClientPhoneResults, searchAppointmentPatients } from './appointmentSearchResults.ts';
import type { ClinicOwnerModel, ClinicPetListModel, PlatformUserSearchModel } from '../services/clinicService';

const localPet: ClinicPetListModel = {
  petUuid: 'local-pet', name: 'Milo', ownerUuid: 'local-owner', ownerName: 'Alex Parent',
  ownerEmail: 'alex@example.test', linked: true,
};
const localOwner: ClinicOwnerModel = {
  ownerUuid: 'local-owner', name: 'Alex Parent', email: 'alex@example.test',
  linked: true, petCount: 1, pets: [{ petUuid: 'local-pet', name: 'Milo', clinicPatient: true }],
};
const platformUser: PlatformUserSearchModel = {
  userUuid: 'platform-user', name: 'Alex Parent', email: 'alex@example.test',
  clinicOwnerUuid: 'local-owner', alreadyClient: true,
  pets: [
    { petUuid: 'local-pet', name: 'Milo', clinicPatient: true },
    { petUuid: 'other-pet', name: 'Misty', globalPetId: 'ABC123', clinicPatient: false },
  ],
};

describe('mergeAppointmentSearchResults', () => {
  it('deduplicates enrolled pets and retains the owner and enrollment state for global pets', () => {
    const hits = mergeAppointmentSearchResults('Alex', [localPet], [localOwner], [platformUser]);
    assert.equal(hits.length, 2);
    assert.equal(hits[0].kind, 'pet');
    assert.deepEqual(hits[1], { kind: 'platformPet', user: platformUser, pet: platformUser.pets![1] });
  });

  describe('searchAppointmentPatients', () => {
    it('only calls the global user search in global mode', async () => {
      let globalCalls = 0;
      const api = {
        pets: async () => [localPet],
        owners: async () => [localOwner],
        users: async () => {
          globalCalls++;
          return [platformUser];
        },
      };
      const local = await searchAppointmentPatients('local', 'Alex', api);
      assert.equal(globalCalls, 0);
      assert.equal(local.length, 1);
      const global = await searchAppointmentPatients('global', 'Alex', api);
      assert.equal(globalCalls, 1);
      assert.equal(global.length, 2);
    });

    it('propagates search failures instead of returning empty results', async () => {
      await assert.rejects(searchAppointmentPatients('global', 'Alex', {
        pets: async () => [],
        owners: async () => [],
        users: async () => { throw new Error('search unavailable'); },
      }), /search unavailable/);
    });
  });

  it('matches platform pet name and public ID without unrelated pets', () => {
    assert.deepEqual(mergeAppointmentSearchResults('mis', [], [], [platformUser]).map((hit) => hit.kind),
      ['platformPet']);
    assert.equal(mergeAppointmentSearchResults('abc123', [], [], [platformUser]).length, 1);
    assert.equal(mergeAppointmentSearchResults('zzzz', [], [], [platformUser]).length, 0);
  });

  it('shows matching local clients without pets', () => {
    const owner = { ...localOwner, petCount: 0, pets: [] };
    assert.deepEqual(mergeAppointmentSearchResults('Alex', [], [owner], []), [{ kind: 'client', owner }]);
  });

  it('retains backend-matched local pets even when the matched linked-parent name differs', () => {
    assert.deepEqual(mergeAppointmentSearchResults('linked parent', [localPet], [], []),
      [{ kind: 'pet', pet: localPet }]);
  });

  it('uses the parent account ID when filtering platform pet results', () => {
    assert.equal(mergeAppointmentSearchResults('platform-user', [], [], [platformUser]).length, 2);
  });

  it('limits displayed results after matching', () => {
    const pets = Array.from({ length: 120 }, (_, index) => ({
      ...localPet, petUuid: `pet-${index}`, name: `Milo ${index}`,
    }));
    assert.equal(mergeAppointmentSearchResults('Milo', pets, [], []).length, 100);
  });

  it('preserves local phone results without including a client’s unenrolled pets', () => {
    const owner = {
      ...localOwner,
      phone: '9876543210',
      pets: [...localOwner.pets!, { petUuid: 'not-enrolled', name: 'Other', clinicPatient: false }],
    };
    const hits = mergeClientPhoneResults('987', [], [owner], []);
    assert.deepEqual(hits.map((hit) => hit.kind === 'pet' && hit.pet.petUuid), ['local-pet']);
  });

  it('finds platform users by phone without selecting or enrolling their pets', () => {
    const user = { ...platformUser, userUuid: 'other-user', clinicOwnerUuid: null, phone: '9876543210' };
    const hits = mergeClientPhoneResults('987', [], [], [user]);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].kind, 'user');
    assert.deepEqual(mergeAppointmentSearchResults('987', [], [], [{ ...user, pets: [] }]), []);
  });

  it('keeps numeric ID matches and deduplicates results from phone search', () => {
    const scoped = mergeAppointmentSearchResults('123', [localPet], [], []);
    const hits = mergeClientPhoneResults('123', scoped, [localOwner],
      [{ ...platformUser, phone: '1234567890' }]);
    assert.deepEqual(hits, scoped);
  });
});
