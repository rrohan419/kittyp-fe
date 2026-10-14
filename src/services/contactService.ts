import axiosInstance from '@/config/axionInstance';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactMessage(body: ContactMessage): Promise<void> {
  await axiosInstance.post('/public/contact', body);
}
