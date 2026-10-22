import fs from 'fs';
import path from 'path';
import { db, Song } from './db';
import { generateWavFile } from './audioSynthesizer';

const AUDIO_DIR = path.resolve(process.cwd(), 'data', 'audio');

export async function ensureSeedSongs() {
  const existing = db.getSongs();
  if (existing.length > 0) return;

  console.log('Seeding initial SK AI demo tracks with synthesized audio...');

  const sampleTracks: Array<Omit<Song, 'id' | 'created_at'> & { id: string }> = [
    {
      id: 'song-seed-1',
      user_id: 'demo-user-1',
      title: 'Tere Sang Beat (तेरे संग)',
      prompt: 'Soulful Bollywood romantic melody with modern lofi acoustic guitar, gentle tabla beats, and emotive Hindi vocals',
      style: 'Bollywood-inspired',
      mood: 'Romantic',
      language: 'Hinglish',
      tempo: 96,
      vocal_style: 'Emotional, Melodic Soft',
      duration: 30,
      audio_url: '/api/audio/song-seed-1',
      cover_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
      lyrics: `[Verse 1]
Khaamoshiyon mein tera chehra
Dhadkan pe tera hi pehra
Har lamha yeh keh raha hai
Dil tere sang behta raha hai

[Chorus]
Tere sang, tere sang yeh raatein
Karti hain bas teri hi baatein
SK AI ki iss dhun mein
Ghul gaye hum tere rang mein

[Outro]
Tere sang... bas tere sang...`,
      provider: 'lyria-3-clip',
      model: 'lyria-3-clip-preview',
      status: 'ready',
    },
    {
      id: 'song-seed-2',
      user_id: 'demo-user-1',
      title: 'Desi Drip Anthem',
      prompt: 'Heavy bass Punjabi hip-hop track with high-energy 808 drop, dhol rolls, and confident Punjabi rap cadence',
      style: 'Rap / Hip-Hop',
      mood: 'Energetic',
      language: 'Punjabi',
      tempo: 98,
      vocal_style: 'Energetic Rap Flow',
      duration: 30,
      audio_url: '/api/audio/song-seed-2',
      cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      lyrics: `[Verse 1]
Gaddi meri kaali, bass kardi boom
Jithe vi main jaawan, saari duniya ghum
Pind ton laike shehar tak chalda ae naat
SK AI di beat te paande aa dhamaak

[Chorus]
Desi drip, saade wakhre andaaz
Sir te sajaaya mehnat da taaj
Rok sake na koi saadi raftaar
Goonjdi awaaz saare sansaar!

[Drop]
Yeah! Dhol beat drop!`,
      provider: 'lyria-3-pro',
      model: 'lyria-3-pro-preview',
      status: 'ready',
    },
    {
      id: 'song-seed-3',
      user_id: 'demo-user-1',
      title: 'Midnight Monsoon Lofi',
      prompt: 'Peaceful rain ambiance lofi chill study beats with vinyl crackle, mellow electric piano chords, and soothing warmth',
      style: 'Lofi',
      mood: 'Chill',
      language: 'Instrumental',
      tempo: 82,
      vocal_style: 'Instrumental Only',
      duration: 30,
      audio_url: '/api/audio/song-seed-3',
      cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      lyrics: `[Instrumental Ambient Meditation]
(Tape hiss, gentle rain droplets, rhodes keyboard progression in D-Major 7th)`,
      provider: 'sk-synth',
      model: 'SK Algorithmic Engine',
      status: 'ready',
    },
    {
      id: 'song-seed-4',
      user_id: 'demo-user-1',
      title: 'Neon Horizon EDM',
      prompt: 'Futuristic melodic EDM festival anthem with soaring supersaws, driving four-on-the-floor beat, and euphoric synth lead',
      style: 'EDM',
      mood: 'Uplifting',
      language: 'English',
      tempo: 128,
      vocal_style: 'Dynamic Pop Vocals',
      duration: 30,
      audio_url: '/api/audio/song-seed-4',
      cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
      lyrics: `[Build]
Feel the voltage in the air tonight
Every heartbeat chasing down the light
Count down the seconds till the skies ignite
Three, two, one — ignite!

[Drop]
(Euphoric lead synth explosion)

[Outro]
SK AI — The music of tomorrow.`,
      provider: 'lyria-3-clip',
      model: 'lyria-3-clip-preview',
      status: 'ready',
    },
  ];

  for (const track of sampleTracks) {
    const filePath = path.resolve(AUDIO_DIR, `${track.id}.wav`);
    try {
      if (!fs.existsSync(filePath)) {
        await generateWavFile(
          {
            durationSeconds: track.duration,
            bpm: track.tempo,
            style: track.style,
            mood: track.mood,
          },
          filePath
        );
      }
      db.addSong({
        ...track,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString(),
      });
    } catch (e) {
      console.error(`Failed to generate seed track ${track.id}:`, e);
    }
  }

  console.log('Seed tracks successfully seeded!');
}
