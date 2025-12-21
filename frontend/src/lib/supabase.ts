import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Supabase configuration for realtime subscriptions
// These should be set in environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with anon key for realtime subscriptions
// Note: This uses the PUBLIC anon key, not the service key
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Realtime features disabled.');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }

  return supabaseClient;
};

// Types for realtime events
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

// Subscribe to milk_entries table changes
export const subscribeToMilkEntries = (
  callback: (payload: RealtimePayload) => void
): RealtimeChannel | null => {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel('milk_entries_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'milk_entries'
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old
        });
      }
    )
    .subscribe((status) => {
      console.log('Milk entries realtime subscription status:', status);
    });

  return channel;
};

// Subscribe to payments table changes
export const subscribeToPayments = (
  callback: (payload: RealtimePayload) => void
): RealtimeChannel | null => {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel('payments_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments'
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old
        });
      }
    )
    .subscribe((status) => {
      console.log('Payments realtime subscription status:', status);
    });

  return channel;
};

// Subscribe to customers table changes
export const subscribeToCustomers = (
  callback: (payload: RealtimePayload) => void
): RealtimeChannel | null => {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client
    .channel('customers_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customers'
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new,
          old: payload.old
        });
      }
    )
    .subscribe((status) => {
      console.log('Customers realtime subscription status:', status);
    });

  return channel;
};

// Unsubscribe from a channel
export const unsubscribeChannel = async (channel: RealtimeChannel | null): Promise<void> => {
  if (channel) {
    const client = getSupabaseClient();
    if (client) {
      await client.removeChannel(channel);
    }
  }
};

// Check if realtime is available
export const isRealtimeAvailable = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
