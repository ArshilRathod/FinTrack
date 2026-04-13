import { useNotificationsContext } from '../contexts/NotificationsContext';

export const useNotifications = () => {
  const context = useNotificationsContext();
  return context;
};
