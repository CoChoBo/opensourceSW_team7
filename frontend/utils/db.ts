import * as SQLite from 'expo-sqlite';

// DB 변수 선언 (초기값은 null)
let db: SQLite.SQLiteDatabase | null = null;

// 1. DB 열기 및 테이블 초기화 함수
export const initDB = async () => {
  // 이미 열려있으면 그대로 사용
  if (db) return;

  // DB 열기 (비동기)
  db = await SQLite.openDatabaseAsync('fridge.db');

  // 테이블 생성
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      expiry INTEGER NOT NULL,
      icon TEXT,
      category TEXT
    );
  `);
};

// 2. 데이터 추가하기
export const addIngredient = async (
  name: string,
  expiry: number,
  category: string,
  onSuccess: () => void
) => {
  if (!db) await initDB(); // DB가 없으면 엽니다.

  let icon = "🍎";
  if (category === "채소") icon = "🥬";
  if (category === "육류") icon = "🥩";
  if (category === "유제품") icon = "🥛";
  if (category === "해산물") icon = "🐟";
  if (category === "가공식품") icon = "🥫";

  try {
    // runAsync 사용
    await db?.runAsync(
      'INSERT INTO ingredients (name, expiry, icon, category) VALUES (?, ?, ?, ?);',
      name, expiry, icon, category
    );
    onSuccess();
  } catch (error) {
    console.error("Insert Error: ", error);
  }
};

// 3. 전체 목록 가져오기
export const getIngredients = async (setItems: (items: any[]) => void) => {
  if (!db) await initDB();

  try {
    // getAllAsync 사용
    const allRows = await db?.getAllAsync('SELECT * FROM ingredients ORDER BY expiry ASC;');
    setItems(allRows || []);
  } catch (error) {
    console.error("Select Error: ", error);
  }
};

// 4. 삭제하기
export const deleteIngredient = async (id: number, onSuccess: () => void) => {
  if (!db) await initDB();

  try {
    await db?.runAsync('DELETE FROM ingredients WHERE id = ?;', id);
    onSuccess();
  } catch (error) {
    console.error("Delete Error: ", error);
  }
};