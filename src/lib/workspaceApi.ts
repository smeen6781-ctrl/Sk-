import { getAccessToken } from './firebase';

export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAA..."
  displayName: string;
  type: string;
}

/**
 * Encodes string to base64url format for Gmail API
 */
function toBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email with song track details & lyrics using Gmail API
 */
export async function sendSongEmail(params: {
  recipientEmail: string;
  songTitle: string;
  songStyle: string;
  lyrics: string;
  audioUrl: string;
  customNote?: string;
}): Promise<{ success: boolean; messageId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google authentication is required to send emails with Gmail.');
  }

  const subject = `🎵 SK AI Song: "${params.songTitle}" (${params.songStyle})`;
  const fullUrl = window.location.origin + params.audioUrl;

  const emailContent = [
    `To: ${params.recipientEmail}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    '',
    `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0b14; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(168,85,247,0.3);">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 18px 24px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; color: white; letter-spacing: -0.5px;">SK AI Song Generator</h1>
        <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Studio-Quality AI Music Generation</p>
      </div>

      <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 8px;">${params.songTitle}</h2>
      <p style="color: #c084fc; font-size: 14px; margin-top: 0; margin-bottom: 16px;">Style: <strong>${params.songStyle}</strong></p>

      ${params.customNote ? `<div style="background: rgba(255,255,255,0.06); padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; border-left: 3px solid #ec4899;"><p style="margin: 0; font-size: 14px; color: #e2e8f0;">"${params.customNote}"</p></div>` : ''}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${fullUrl}" style="background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(168,85,247,0.4);">
          ▶ Play Audio Track
        </a>
      </div>

      <div style="background: rgba(17,17,29,0.9); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-top: 24px;">
        <h3 style="margin-top: 0; font-size: 15px; color: #a855f7; text-transform: uppercase; letter-spacing: 1px;">Song Lyrics</h3>
        <pre style="white-space: pre-wrap; font-family: inherit; font-size: 13px; color: #cbd5e1; line-height: 1.6; margin: 0;">${params.lyrics || '(Instrumental Master Track)'}</pre>
      </div>

      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0 16px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">Generated with SK AI Studio — powered by Google Lyria & ElevenLabs architecture.</p>
    </div>`,
  ].join('\r\n');

  const raw = toBase64Url(emailContent);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gmail API error (${response.status})`);
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
}

/**
 * List user Google Chat spaces
 */
export async function listChatSpaces(): Promise<GoogleChatSpace[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google authentication is required to access Google Chat spaces.');
  }

  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Chat error (${response.status})`);
  }

  const data = await response.json();
  return (data.spaces || []).map((s: any) => ({
    name: s.name,
    displayName: s.displayName || s.name.replace('spaces/', 'Space '),
    type: s.type || 'SPACE',
  }));
}

/**
 * Post song card & message to Google Chat space
 */
export async function postSongToChatSpace(params: {
  spaceName: string; // "spaces/AAA..."
  songTitle: string;
  songStyle: string;
  audioUrl: string;
  messageText?: string;
}): Promise<{ success: boolean; messageId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google authentication is required to post to Google Chat.');
  }

  const fullUrl = window.location.origin + params.audioUrl;
  const note = params.messageText ? `${params.messageText}\n\n` : '';
  const text = `${note}🎵 *SK AI Song Release*: **${params.songTitle}**\nStyle: _${params.songStyle}_\nListen here: ${fullUrl}`;

  const response = await fetch(`https://chat.googleapis.com/v1/${params.spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Chat post error (${response.status})`);
  }

  const result = await response.json();
  return { success: true, messageId: result.name };
}
