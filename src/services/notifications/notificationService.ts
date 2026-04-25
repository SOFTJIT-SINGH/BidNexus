import { supabase } from '@/src/services/supabase/supabase';

export interface Notification {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'bid' | 'outbid' | 'win' | 'update';
  is_read?: boolean;
  created_at?: string;
}

export const notificationService = {
  async sendNotification(notification: Notification) {
    try {
      const insertData: any = {
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        is_read: false
      };
      
      // Only include type if it's provided (it might be missing in the DB schema)
      if (notification.type) {
        insertData.type = notification.type;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([insertData]);
      
      if (error) {
        console.error('Error storing notification:', error);
        // Temporary alert to help user debug SQL/RLS issues
        import('react-native').then(({ Alert }) => {
          Alert.alert('DB Error', `Failed to save notification: ${error.message}. Make sure you ran the SQL script!`);
        });
        return { success: false, error };
      }
      return { success: true, data };
    } catch (error) {
      console.error('Notification service error:', error);
      return { success: false, error };
    }
  },

  async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
};
