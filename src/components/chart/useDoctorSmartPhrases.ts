import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import {
  clearSmartPhraseError,
  createSmartPhrase,
  deleteSmartPhrase,
  loadDoctorSmartPhrases,
  setSmartPhraseError,
  updateSmartPhrase,
} from '@/module/slice/DoctorSmartPhrasesSlice';

export function useDoctorSmartPhrases(enabled: boolean) {
  const dispatch = useAppDispatch();
  const doctorUuid = useAppSelector((state) => state.authReducer.user?.uuid);
  const smartPhrases = useAppSelector((state) =>
    state.doctorSmartPhrases.doctorUuid === doctorUuid
      ? state.doctorSmartPhrases
      : undefined
  );

  useEffect(() => {
    if (enabled && doctorUuid) void dispatch(loadDoctorSmartPhrases(doctorUuid));
  }, [dispatch, doctorUuid, enabled]);

  const create = useCallback(async (phraseText: string): Promise<boolean> => {
    if (!doctorUuid) {
      dispatch(setSmartPhraseError('Could not identify your doctor account. Please sign in again.'));
      return false;
    }
    return dispatch(createSmartPhrase({ doctorUuid, phraseText })).unwrap().then(
      () => true,
      () => false
    );
  }, [dispatch, doctorUuid]);

  const update = useCallback(async (uuid: string, phraseText: string): Promise<boolean> => {
    if (!doctorUuid) {
      dispatch(setSmartPhraseError('Could not identify your doctor account. Please sign in again.'));
      return false;
    }
    return dispatch(updateSmartPhrase({ doctorUuid, uuid, phraseText })).unwrap().then(
      () => true,
      () => false
    );
  }, [dispatch, doctorUuid]);

  const remove = useCallback(async (uuid: string): Promise<boolean> => {
    if (!doctorUuid) {
      dispatch(setSmartPhraseError('Could not identify your doctor account. Please sign in again.'));
      return false;
    }
    return dispatch(deleteSmartPhrase({ doctorUuid, uuid })).unwrap().then(
      () => true,
      () => false
    );
  }, [dispatch, doctorUuid]);

  const clearError = useCallback(() => dispatch(clearSmartPhraseError()), [dispatch]);

  return {
    phrases: smartPhrases?.phrases ?? [],
    loading: smartPhrases?.loading ?? false,
    saving: smartPhrases?.saving ?? false,
    error: smartPhrases?.error ?? null,
    create,
    update,
    remove,
    clearError,
  };
}
