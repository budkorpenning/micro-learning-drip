// Supabase Edge Function: send-daily-reminder
// Called by pg_cron every minute to send push notifications to users with due items

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface UserDueForNotification {
  user_id: string;
  timezone: string;
  due_count: number;
  expo_push_tokens: string[] | null;
}

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data: { type: string };
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error: string };
}

Deno.serve(async (req) => {
  // Verify request is authorized (from cron or with service key)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get users due for notification using the helper function
    const { data: users, error: fetchError } = await supabase
      .rpc('get_users_due_for_notification');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users due for notification' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${users.length} user(s) due for notification`);

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const user of users as UserDueForNotification[]) {
      const { user_id, due_count, expo_push_tokens } = user;

      if (!expo_push_tokens || expo_push_tokens.length === 0) {
        console.log(`User ${user_id} has no active push tokens, skipping`);
        // Still mark as notified to prevent retry spam
        await supabase.rpc('mark_user_notified', {
          p_user_id: user_id,
          p_due_count: due_count,
          p_tokens_sent: 0,
          p_tokens_failed: 0,
        });
        results.push({ userId: user_id, success: true, error: 'No tokens' });
        continue;
      }

      // Build notification messages for each token
      const messages: ExpoPushMessage[] = expo_push_tokens.map((token) => ({
        to: token,
        sound: 'default' as const,
        title: 'Time to learn!',
        body: due_count === 1
          ? 'You have 1 item ready to review'
          : `You have ${due_count} items ready to review`,
        data: { type: 'daily_reminder' },
        channelId: 'daily-reminders',
      }));

      // Send to Expo Push API
      let tokensSent = 0;
      let tokensFailed = 0;

      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        const tickets: { data: ExpoPushTicket[] } = await response.json();

        // Process tickets to check for errors
        for (let i = 0; i < tickets.data.length; i++) {
          const ticket = tickets.data[i];
          const token = expo_push_tokens[i];

          if (ticket.status === 'ok') {
            tokensSent++;
          } else {
            tokensFailed++;
            console.error(`Push failed for token ${token}:`, ticket.message);

            // Disable invalid tokens
            if (ticket.details?.error === 'DeviceNotRegistered') {
              console.log(`Disabling invalid token: ${token}`);
              await supabase.rpc('disable_push_token', { p_token: token });
            }
          }
        }

        // Mark user as notified
        await supabase.rpc('mark_user_notified', {
          p_user_id: user_id,
          p_due_count: due_count,
          p_tokens_sent: tokensSent,
          p_tokens_failed: tokensFailed,
        });

        results.push({
          userId: user_id,
          success: tokensSent > 0,
          error: tokensFailed > 0 ? `${tokensFailed} tokens failed` : undefined,
        });

      } catch (pushError) {
        console.error(`Error sending push for user ${user_id}:`, pushError);
        results.push({
          userId: user_id,
          success: false,
          error: String(pushError),
        });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
