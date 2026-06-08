// scripts/seed.mjs
// Run: node scripts/seed.mjs
// Requires: .env.local with NEXT_PUBLIC_FIREBASE_* variables

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const firebaseConfig = {
  apiKey:            env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain:        env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId:         env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket:     env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId:             env['NEXT_PUBLIC_FIREBASE_APP_ID'],
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Seed data ────────────────────────────────────────────
const JUDGES = [
  { id: 'judge_1', name: 'Anh Nguyễn Bình Minh', code: 'K7M2X9', avatar: '/imgs/anh_nguyen_binh_minh.png' },
  { id: 'judge_2', name: 'Anh Nguyễn Đức Thắng', code: 'P4N8Q3', avatar: '/imgs/anh_nguyen_duc_thang.png' },
  { id: 'judge_3', name: 'Anh Trần Vĩnh Đức', code: 'T9R5W1', avatar: '/imgs/anh_tran_vinh_duc.png' },
  { id: 'judge_4', name: 'Anh Trịnh Tuấn Đạt', code: 'C6Y2L8', avatar: '/imgs/anh_trinh_tuan_dat.png' },
  { id: 'judge_5', name: 'Anh Lê Đình Quyền', code: 'H3V7K4', avatar: '/imgs/anh_le_dinh_quyen.png' },
  { id: 'judge_6', name: 'Anh Phạm Viết Bằng', code: 'Z8F1M5', avatar: '/imgs/anh_pham_viet_bang.png' },
];

const TEAMS = [
  { id: 'team_1', name: 'Team Âu Bất Gâu' },
  { id: 'team_2', name: 'Team RED' },
  { id: 'team_3', name: 'Team Xanh Sao' },
  { id: 'team_4', name: 'Team Tia Cực Tím' },
];

async function clearCollection(colName) {
  const snap = await getDocs(collection(db, colName));
  for (const d of snap.docs) await deleteDoc(d.ref);
  console.log(`  Cleared ${snap.size} docs from '${colName}'`);
}

async function seed() {
  console.log('\n🌱 Starting seed...\n');

  // Clear old data
  await clearCollection('judges');
  await clearCollection('teams');
  await clearCollection('scores');

  // Seed judges
  for (const j of JUDGES) {
    const { id, ...data } = j;
    await setDoc(doc(db, 'judges', id), data);
    console.log(`  ✓ Judge: ${j.name} | Code: ${j.code}`);
  }

  // Seed teams
  for (const t of TEAMS) {
    const { id, ...data } = t;
    await setDoc(doc(db, 'teams', id), data);
    console.log(`  ✓ Team: ${t.name}`);
  }

  console.log('\n✅ Seed completed!\n');
  console.log('Judge codes:');
  JUDGES.forEach((j) => console.log(`  ${j.name}: ${j.code}`));
  console.log('\nYou can update codes, names, and avatars in this file before running.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
