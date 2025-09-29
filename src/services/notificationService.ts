import axiosInstance from '@/config/axionInstance';

export const saveFcmToken = async (fcmToken: string): Promise<void> => {
  // Backend endpoint expects token in path: /user/{fcmToken}
  await axiosInstance.patch(`/user/${encodeURIComponent(fcmToken)}`);
}; 